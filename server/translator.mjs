// src/translator/server.ts
import { createClient as createClient2 } from "@supabase/supabase-js";

// src/translator/phonetics.ts
import { createClient } from "@supabase/supabase-js";

// src/utils/thaiTextSanitizer.ts
function sanitizeThaiText(text, options) {
  if (!text || typeof text !== "string") return "";
  let charClass = `[().,;:!?"'{}\u2026\u2014\u2013\u201C\u201D\u2018\u2019`;
  if (!options?.preserveHyphen) charClass += "\\-";
  if (!options?.preserveBrackets) charClass += "\\[\\]";
  charClass += "]";
  const sanitized = text.replace(new RegExp(charClass, "g"), "");
  return sanitized.trim();
}

// src/services/phonetics/requestG2P.ts
var THAI_RE = /[\u0E00-\u0E7F]/u;
var THAI_ONLY_RE = /^[\u0E00-\u0E7F]+$/u;
var PLAUSIBLE_PHONEME_RE = /^[A-Za-z0-9@()*^|._+\-]+$/;
var RETRYABLE_STATUS = /* @__PURE__ */ new Set([429, 502, 503, 504]);
var MAX_ATTEMPTS = 3;
var G2PRequestError = class extends Error {
  details;
  constructor(message, details, options) {
    super(message, options);
    this.name = "G2PRequestError";
    this.details = details;
  }
};
function classifyG2pInput(text) {
  const raw = typeof text === "string" ? text.trim() : "";
  const clean = sanitizeThaiText(raw).trim();
  if (!clean) return { raw, clean, kind: "empty", eligible: false };
  if (!THAI_RE.test(clean)) return { raw, clean, kind: "non_thai", eligible: false };
  if (THAI_ONLY_RE.test(clean)) {
    return { raw, clean, kind: clean.includes("\u0E46") ? "thai_repeat" : "thai", eligible: true };
  }
  return { raw, clean, kind: "thai_mixed", eligible: false };
}
function responseShape(value) {
  if (Array.isArray(value)) return "array";
  if (value && typeof value === "object") return `object:${Object.keys(value).sort().join(",")}`;
  return typeof value;
}
function failure(message, assessment, kind, input, cause) {
  return new G2PRequestError(
    message,
    {
      kind,
      retryable: input?.retryable ?? false,
      status: input?.status ?? null,
      retryAfter: input?.retryAfter ?? null,
      inputKind: assessment.kind,
      cleanInput: assessment.clean,
      responseShape: input?.responseShape ?? null,
      responsePreview: input?.responsePreview ?? null
    },
    cause === void 0 ? void 0 : { cause }
  );
}
function retryDelayMs(response, attempt) {
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds * 1e3, 6e4);
  }
  return Math.min(1e3 * 2 ** attempt, 15e3);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function requestG2P(text, apiKey, transport = fetch, endpoint = "https://api.aiforthai.in.th/g2p") {
  const assessment = classifyG2pInput(text);
  if (!assessment.eligible) {
    const message = assessment.kind === "non_thai" ? "Pronunciation skipped: the input contains no Thai script." : assessment.kind === "thai_mixed" ? "Pronunciation skipped: the word-level input mixes Thai with spaces, digits, or other scripts." : "Pronunciation skipped: the input is empty after cleaning.";
    throw failure(
      message,
      assessment,
      "invalid_input"
    );
  }
  if (!apiKey.trim()) {
    throw failure("Pronunciation service is not configured.", assessment, "not_configured");
  }
  let response = null;
  let lastTransportError;
  let lastTransportTimedOut = false;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      response = await transport(endpoint, {
        method: "POST",
        headers: { Apikey: apiKey.trim(), "Content-Type": "application/json" },
        body: JSON.stringify({ text: assessment.clean, output_type: "phoneme" }),
        signal: AbortSignal.timeout(15e3)
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
      lastTransportError = error;
      lastTransportTimedOut = timedOut;
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(Math.min(1e3 * 2 ** attempt, 15e3));
        continue;
      }
      break;
    }
    if (!RETRYABLE_STATUS.has(response.status) || attempt === MAX_ATTEMPTS - 1) break;
    await sleep(retryDelayMs(response, attempt));
  }
  if (!response) {
    throw failure(
      lastTransportTimedOut ? "Pronunciation request timed out after three attempts." : "Pronunciation request could not reach AI4Thai after three attempts.",
      assessment,
      lastTransportTimedOut ? "timeout" : "transport",
      { retryable: true },
      lastTransportError
    );
  }
  let raw;
  try {
    raw = await response.text();
  } catch (error) {
    throw failure("AI4Thai responded, but its response body could not be read.", assessment, "transport", {
      retryable: true,
      status: response.status,
      retryAfter: response.headers.get("Retry-After")
    }, error);
  }
  const preview = raw.slice(0, 300) || null;
  const retryAfter = response.headers.get("Retry-After");
  if (!response.ok) {
    const common = { status: response.status, retryAfter, responsePreview: preview };
    if (response.status === 401 || response.status === 403) {
      throw failure("AI4Thai rejected the configured API key.", assessment, "authentication", common);
    }
    if (response.status === 429) {
      throw failure("AI4Thai rate or quota limit was reached.", assessment, "rate_limit", {
        ...common,
        retryable: true
      });
    }
    if (response.status >= 500) {
      throw failure(`AI4Thai is temporarily unavailable (${response.status}).`, assessment, "service_unavailable", {
        ...common,
        retryable: true
      });
    }
    throw failure(`AI4Thai rejected this request (${response.status}).`, assessment, "http_error", common);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw failure("AI4Thai returned a non-JSON pronunciation response.", assessment, "invalid_json", {
      status: response.status,
      responsePreview: preview
    }, error);
  }
  const record = data && typeof data === "object" ? data : {};
  const value = typeof record.phoneme === "string" ? record.phoneme : typeof record.result === "string" ? record.result : Array.isArray(record.result) && record.result.every((item) => typeof item === "string") ? record.result.join("|") : "";
  const shape = responseShape(data);
  if (!value.trim()) {
    throw failure("AI4Thai returned a valid response with no phonetics.", assessment, "empty_response", {
      status: response.status,
      responseShape: shape,
      responsePreview: preview
    });
  }
  const phoneme = value.trim();
  if (THAI_RE.test(phoneme) || !/[A-Za-z]/.test(phoneme) || !PLAUSIBLE_PHONEME_RE.test(phoneme)) {
    throw failure("AI4Thai returned phonetics in an unexpected format.", assessment, "invalid_response", {
      status: response.status,
      responseShape: shape,
      responsePreview: preview
    });
  }
  return phoneme;
}

// src/services/phonetics/fillMissingWordG2p.ts
async function fillMissingWordG2p(word, store) {
  const key = word.trim();
  if (!classifyG2pInput(key).eligible) return null;
  let row = await store.read(key);
  if (row?.g2p?.trim()) return row;
  if (!row) {
    await store.create(key);
    row = await store.read(key);
  }
  if (row?.g2p?.trim()) return row;
  const g2p = (await store.generate(key))?.trim();
  if (!g2p) return row;
  row = await store.read(key);
  if (row?.g2p?.trim()) return row;
  await store.saveG2p(key, g2p);
  return store.read(key);
}

// src/translator/phonetics.ts
async function processTranslatorPhonetics(words, env) {
  const url = env.TRANSLATOR_WORDS_URL || env.VITE_SUPABASE_URL;
  const key = env.TRANSLATOR_WORDS_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("The shared word database is not configured.");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const read = async (word) => {
    const { data, error } = await db.from("words_th").select("word_th,g2p").eq("word_th", word).maybeSingle();
    if (error) throw error;
    return data;
  };
  const results = [];
  for (const word of [...new Set(words.map((word2) => word2.trim()))]) {
    try {
      const row = await fillMissingWordG2p(word, {
        read,
        create: async (word2) => {
          const { error } = await db.from("words_th").upsert({ word_th: word2 }, { onConflict: "word_th", ignoreDuplicates: true });
          if (error) throw error;
        },
        saveG2p: async (word2, g2p) => {
          const current = await read(word2);
          if (!current || current.g2p?.trim()) return;
          let update = db.from("words_th").update({ g2p }).eq("word_th", word2);
          update = current.g2p === null ? update.is("g2p", null) : update.eq("g2p", current.g2p);
          const { error } = await update;
          if (error) throw error;
        },
        generate: (word2) => requestG2P(word2, env.AI4THAI_API_KEY || env.VITE_AI4THAI_API_KEY || "")
      });
      results.push({ word, saved: !!row?.g2p?.trim() });
    } catch (error) {
      results.push({ word, saved: false, error: error instanceof Error ? error.message : "Pronunciation could not be saved." });
    }
  }
  return { words: results };
}

// src/translator/testSession.ts
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
var NAME = "__Host-translator-test";
var MAX_AGE = 7 * 24 * 60 * 60;
var signature = (payload, secret) => createHmac("sha256", secret).update(payload).digest("base64url");
function createTestSessionCookie(secret, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ audience: "translator-peta-test", expires: Math.floor(now / 1e3) + MAX_AGE, nonce: randomBytes(16).toString("hex") })).toString("base64url");
  return `${NAME}=${payload}.${signature(payload, secret)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}
function validTestSession(cookie, secret, now = Date.now()) {
  if (!secret || !cookie) return false;
  const value = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${NAME}=`))?.slice(NAME.length + 1);
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const [payload, supplied] = parts;
  const expected = signature(payload, secret);
  const actualBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.audience === "translator-peta-test" && Number.isFinite(data.expires) && data.expires > now / 1e3;
  } catch {
    return false;
  }
}

// src/translator/model.ts
import { z } from "zod";
var translationSchema = z.object({
  english: z.string().min(1).max(3e3),
  thai: z.string().min(1).max(6e3),
  words: z.array(z.object({
    thai: z.string().min(1).max(100),
    english: z.string().min(1).max(250),
    grammar: z.string().max(80).nullable()
  })).min(1).max(200)
}).refine((value) => value.words.map((word) => word.thai).join("").replace(/\s/g, "") === value.thai.replace(/\s/g, ""), "Word alignment must cover the Thai sentence exactly");

// src/services/learningProfile/speakingGender.ts
function speakingGender(metadata) {
  const value = metadata?.speaking_gender;
  return value === "male" || value === "female" ? value : "unspecified";
}
function speakerPrompt(gender) {
  const preference = gender === "male" ? "The account speaker uses male Thai phrasing: prefer \u0E1C\u0E21 when a first-person pronoun is needed and \u0E04\u0E23\u0E31\u0E1A when a polite particle is appropriate." : gender === "female" ? "The account speaker uses female Thai phrasing: prefer \u0E09\u0E31\u0E19 or \u0E14\u0E34\u0E09\u0E31\u0E19 as appropriate to register, and \u0E04\u0E48\u0E30 for statements or \u0E04\u0E30 for questions when a polite particle is appropriate." : "No speaking gender is selected. Do not assume the speaker\u2019s gender; prefer natural gender-neutral phrasing.";
  return `${preference} Apply this preference only to the account speaker, not other people or quoted speakers. Explicit speaker information in the input takes precedence. Preserve meaning and register; do not add a pronoun or polite particle to every sentence. Do not change factual gender, vocabulary definitions, or subtitle dialogue to match the account.`;
}

// src/translator/server.ts
function translatorHandler(env) {
  return async (req, res) => {
    const started = Date.now();
    let stage = "authentication";
    let failureCode = "request_failed";
    const respond = (status, data) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify(data));
    };
    if (req.method !== "POST") return respond(405, { error: "Use POST." });
    const testSecret = env.TRANSLATOR_TEST_MODE === "peta" ? env.TRANSLATOR_TEST_SESSION_SECRET || "" : "";
    const allowedOrigin = env.TRANSLATOR_SITE_ORIGIN || "";
    if (req.url === "/session") {
      if (!testSecret || !allowedOrigin) return respond(404, { error: "Not found." });
      if (req.headers.origin !== allowedOrigin) return respond(403, { error: "Open the translator website to connect." });
      res.setHeader("Set-Cookie", createTestSessionCookie(testSecret));
      return respond(200, { connected: true });
    }
    const browserTest = !!testSecret && validTestSession(req.headers.cookie, testSecret) && (!req.headers.origin || req.headers.origin === allowedOrigin);
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    const localTest = !!env.TRANSLATOR_LOCAL_USER_ID && ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket?.remoteAddress ?? "") && req.headers.host === "127.0.0.1:5177" && (!req.headers.origin || req.headers.origin === "http://127.0.0.1:5177");
    if (!token && !localTest && !browserTest) return respond(401, { error: "Sign in with your Thai Netflix account first." });
    try {
      let gender = browserTest || localTest ? "male" : "unspecified";
      if (!localTest && !browserTest) {
        const db = createClient2(env.TRANSLATOR_AUTH_URL || env.VITE_SUPABASE_URL, env.TRANSLATOR_AUTH_KEY || env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
        const { data, error } = await db.auth.getUser(token);
        if (error || !data.user) return respond(401, { error: "Please sign in again." });
        gender = speakingGender(data.user.user_metadata);
        if (env.TRANSLATOR_ALLOWED_USER_ID && data.user.id !== env.TRANSLATOR_ALLOWED_USER_ID) return respond(403, { error: "This translator is currently for Peta\u2019s account." });
      }
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 3e6) return respond(413, { error: "Please use a recording under two minutes." });
        chunks.push(Buffer.from(chunk));
      }
      stage = "input";
      const raw = JSON.parse(Buffer.concat(chunks).toString());
      if (req.url === "/phonetics") {
        if (!Array.isArray(raw.words) || raw.words.length > 4 || !raw.words.every((word) => typeof word === "string" && word.trim().length > 0 && word.length <= 120)) return respond(400, { error: "Provide up to four words." });
        return respond(200, await processTranslatorPhonetics(raw.words, env));
      }
      if (!env.OPENAI_API_KEY) return respond(503, { error: "Speech and translation are not configured yet." });
      const call = async (path, body, json = false) => {
        const result2 = await fetch(`https://api.openai.com/v1/${path}`, { method: "POST", headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, ...json ? { "Content-Type": "application/json" } : {} }, body, signal: AbortSignal.timeout(6e4) });
        if (!result2.ok) {
          failureCode = `provider_${result2.status}`;
          throw new Error(result2.status === 429 ? "The AI service is busy or has reached its usage limit. Please retry." : "The AI service could not complete this request. Please retry.");
        }
        return result2.json();
      };
      if (req.url === "/transcribe") {
        if (typeof raw.audio !== "string" || !["audio/webm", "audio/mp4", "audio/ogg"].some((mime) => raw.mime?.startsWith(mime))) return respond(400, { error: "Invalid audio recording." });
        const bytes = Buffer.from(raw.audio, "base64");
        if (bytes.length < 100 || bytes.length > 2e6) return respond(400, { error: "Recording is empty or too large." });
        const form = new FormData();
        form.set("model", "whisper-1");
        form.set("language", "en");
        form.set("file", new Blob([bytes], { type: raw.mime }), raw.mime.startsWith("audio/mp4") ? "speech.m4a" : raw.mime.startsWith("audio/ogg") ? "speech.ogg" : "speech.webm");
        stage = "transcription";
        const result2 = await call("audio/transcriptions", form);
        if (!result2.text?.trim()) throw new Error("No clear speech was heard. Please try again.");
        return respond(200, { text: result2.text });
      }
      if (req.url !== "/translate") return respond(404, { error: "Not found." });
      if (typeof raw.text !== "string" || !raw.text.trim() || raw.text.length > 3e3) return respond(400, { error: "Enter a sentence of up to 3,000 characters." });
      stage = "translation";
      const result = await call("chat/completions", JSON.stringify({ model: env.OPENAI_TRANSLATOR_MODEL || "gpt-4o-mini", store: false, temperature: 0.2, max_tokens: 4e3, response_format: { type: "json_object" }, messages: [
        { role: "system", content: "Translate the supplied English into natural Thai for a learner. Return JSON only: {english:string,thai:string,words:[{thai:string,english:string,grammar:string|null}]}. Segment into lexical Thai words in Thai order, preserving punctuation as a separate token if present. Concatenating all thai tokens must exactly reproduce thai (ignoring spaces). Each English gloss must explain that occurrence, including particles without literal English equivalents. Grammar must be a conventional contextual grammatical type such as Noun, Pronoun, Verb, Stative verb, Auxiliary, Negator, Adverb, Preposition, Linker or Particle, never a semantic category or sentence role. Use null if uncertain. Do not invent details or participants absent from the English. Use the account speaking preference below only where Thai requires a speaker-dependent choice. These are draft translations, not reviewed Netflix annotations. " + speakerPrompt(gender) },
        { role: "user", content: raw.text }
      ] }), true);
      const choice = result.choices?.[0];
      if (choice?.finish_reason !== "stop" || !choice.message?.content) {
        failureCode = choice?.finish_reason === "length" ? "output_limit" : "incomplete_output";
        throw new Error("Translation was incomplete. Please try a shorter sentence.");
      }
      stage = "alignment";
      failureCode = "invalid_translation";
      const parsed = translationSchema.safeParse(JSON.parse(choice.message.content));
      if (!parsed.success) throw new Error("The word alignment was incomplete. Please retry.");
      respond(200, { ...parsed.data, english: raw.text });
    } catch (error) {
      console.error("[translator.request.failed]", JSON.stringify({ action: req.url, stage, code: error instanceof SyntaxError ? "invalid_json" : failureCode, elapsedMs: Date.now() - started }));
      respond(502, { error: error instanceof SyntaxError ? "The response could not be read. Please retry." : error instanceof Error ? error.message : "Please retry." });
    }
  };
}
export {
  translatorHandler
};

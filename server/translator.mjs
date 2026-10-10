// src/translator/server.ts
import { createClient as createClient2 } from "@supabase/supabase-js";

// src/translator/phonetics.ts
import { createClient } from "@supabase/supabase-js";

// src/services/phonetics/phoneticBackfillTriggers.ts
var THAI_RE = /[\u0E00-\u0E7F]/;
function containsThaiScript(s) {
  if (!s) return false;
  return THAI_RE.test(s);
}

// src/services/phonetics/fillMissingWordG2p.ts
async function fillMissingWordG2p(word, store) {
  const key = word.trim();
  if (!containsThaiScript(key)) return null;
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
async function requestG2P(text, apiKey, transport = fetch) {
  const clean = sanitizeThaiText(text).trim();
  if (!clean || !apiKey.trim()) throw new Error("Pronunciation service is not configured.");
  let response;
  for (let attempt = 0; ; attempt++) {
    response = await transport("https://api.aiforthai.in.th/g2p", {
      method: "POST",
      headers: { Apikey: apiKey.trim(), "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean, output_type: "phoneme" }),
      signal: AbortSignal.timeout(15e3)
    });
    if (response.status !== 429 || attempt >= 2) break;
    await new Promise((resolve) => setTimeout(resolve, 5e3));
  }
  if (!response.ok) throw new Error(`Pronunciation service returned ${response.status}.`);
  const data = await response.json();
  const value = typeof data.phoneme === "string" ? data.phoneme : typeof data.result === "string" ? data.result : Array.isArray(data.result) && data.result.every((item) => typeof item === "string") ? data.result.join("|") : "";
  if (!value.trim()) throw new Error("Pronunciation service returned no phonetics.");
  return value.trim();
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
      if (!localTest && !browserTest) {
        const db = createClient2(env.TRANSLATOR_AUTH_URL || env.VITE_SUPABASE_URL, env.TRANSLATOR_AUTH_KEY || env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
        const { data, error } = await db.auth.getUser(token);
        if (error || !data.user) return respond(401, { error: "Please sign in again." });
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
        { role: "system", content: "Translate the supplied English into natural Thai for a learner. Return JSON only: {english:string,thai:string,words:[{thai:string,english:string,grammar:string|null}]}. Segment into lexical Thai words in Thai order, preserving punctuation as a separate token if present. Concatenating all thai tokens must exactly reproduce thai (ignoring spaces). Each English gloss must explain that occurrence, including particles without literal English equivalents. Grammar must be a conventional contextual grammatical type such as Noun, Pronoun, Verb, Stative verb, Auxiliary, Negator, Adverb, Preposition, Linker or Particle, never a semantic category or sentence role. Use null if uncertain. Do not invent details, politeness, gender, or participants absent from the English. These are draft translations, not reviewed Netflix annotations." },
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

# Sentence playback contract

Kokoro Heart and the English wav2vec2 forced aligner run on the existing server, on standard CPU. The browser never needs to download or execute either model. Both PC and LINE/iPhone request `/api/sentence-audio`, receive a saved WAV and word-timing URL, and use the same player and sentence boxes. No ElevenLabs API call or new provider secret is involved.

## Generation and cache

The endpoint authenticates the learner and resolves the canonical question/recipe or validated whiteboard document. `registerOnly` continues to register scoring questions without generating speech. While a Testing question is open, silently prepare only its two immediate next-question branches (right and wrong). Use the same adaptive selector with hypothetical evidence; never save that evidence or count preparation as exposure. Check the shared cache first and start missing branch requests in parallel. Deduplicate identical sentences and in-flight requests; do not prepare whole forecast decks. The actual answer selects from the same branch resolver and stores the selected next question before Continue. A later progress refresh must not replace it. Recalculate the branches when actual playback/help evidence changes. Retain downloaded audio as a local Blob URL so prepared playback makes no further audio-file request; bound retained recordings to 64.

`scripts/prepareVoiceModels.mjs` packages pinned public Kokoro and alignment weights at build time. Compressed models ship with the standard server function and expand atomically into its temporary filesystem. Runtime remote-model downloads are disabled. Native CPU inference is used; CUDA installation is disabled. Model loading and inference are reused within a warm function.

`server/kokoroCache.ts` stores immutable PCM16 WAV/timing pairs in the existing public `sentence-audio` bucket. Text/provider/model identity selects a cache pointer. Audio hashes bind each recording to its timing file; concurrent requests within a function share one task. Replays reuse the saved file, across learners. Existing recordings remain a sound fallback if the server is temporarily unavailable.

## UI and recovery

Show one shared loading wheel over the turtle/hare pair. No visible preparation words. Keep actionable retry errors visible. Answers remain available if sound fails; an unheard answer must not earn independent listening mastery.

Use a valid 100ms PCM clip to unlock the media element during a real tap, and await playback start before replacing its source. A one-sample clip was rejected in mobile WebKit. Slow/normal playback share the same file and timing. The amplitude-driven tile effect remains, without a separate waveform panel.

## Verification

Verify server synthesis, shared cache hits, then the full Testing UI without client model downloads. Desktop/mobile-configured WebKit tests do not prove real LINE iPhone acceptance; keep that final user check explicit.

The local batch helper remains available: `uv run --python 3.11 scripts/alignSentenceAudio.py --jobs jobs.json`. It is not required by the live phone.

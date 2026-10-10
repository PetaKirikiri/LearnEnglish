# Translator route

`/translator` hosts the translator exported from the sibling SubtitleDisplay project. Its shared phonetics and Thai Netflix word data remain there; English Success supplies hosting. The owner-enabled Peta testing page uses independent signed, HttpOnly browser cookies so one device cannot invalidate another device's connection.

To update the page or generated gateway, run `node scripts/export-translator.mjs ../fifa-english` from SubtitleDisplay after pulling English Success's production configuration into `.vercel/.env.production.local`. Then deploy this project normally. The checked-in export lets normal English Success builds run without the sibling repository.

`api/translator/[action].ts` explicitly enables the Peta testing page; its same-origin `/session` endpoint issues a seven-day browser cookie signed with `TRANSLATOR_TEST_SESSION_SECRET`. This is a no-login shared testing page, not private per-user authentication. Normal bearer-token authentication is retained for non-test consumers. Disable the explicit test mode before introducing individual accounts. `TRANSLATOR_OPENAI_API_KEY` is a server-only Vercel secret. Never enable the local prototype authentication bypass in hosted builds.

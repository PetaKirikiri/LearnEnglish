# Private vocabulary diagnostic

Run `npm run diagnostics` and open http://127.0.0.1:5197/vocabulary-review.html. The diagnostic opens directly on Peta and provides an English class student dropdown. It reads saved database progress using the existing local server credential; it never signs in as a learner or changes a learner session.

The local server uses the ignored `.env.local` values `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `CITY_SUPABASE_SERVICE_KEY`). No credential enters browser code. Requests must originate from the loopback interface and a localhost/loopback host, with the same origin when supplied. Cross-site requests are rejected. The diagnostic middleware only exists in the development server and is not a deployed API route.

Public pages keep normal authentication. The local diagnostic reads only the English Success roster and selected learner word-progress fields. Selecting a learner is read-only. Frontiers and word scores use the same hierarchy and score model as the account page.

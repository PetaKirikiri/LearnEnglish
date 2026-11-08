# EnglishSuccess answer recovery

Authenticated practice uploads go through `submit_english_attempt`. It stores the original answer in `english_attempt_inbox` before attempting scoring. A scorer failure produces a durable `needs_review` receipt; it does not reject the upload or block the next answer. The client removes an outbox entry only after receiving its receipt. Connection, authentication, or receipt-storage failures leave the answer on the same device for retry.

An accepted receipt is **not** proof of earned coins. Existing scorers still check correctness, enforce account ownership, prevent duplicate credits, and use the original answer date. Coins, leaderboards and word proficiency update only after scoring succeeds.

The `english-attempt-inbox-retry` database job checks due receipts every minute. Each failed receipt backs off from one minute to six hours. Fixing a missing question or catalogue entry lets the next retry score the saved answer. Existing `record_english_*_answer` RPCs wrap the same inbox for older app versions.

## Inspect unresolved receipts

Run with a database operator connection. Limit learner details to the investigation.

```sql
select id, learner_id, source, client_id, received_at,
       processing_attempts, next_retry_at, error_code, error_message
from public.english_attempt_inbox
where status <> 'scored'
order by received_at;
```

After fixing the underlying catalogue or scorer, retry a specific saved receipt:

```sql
select public.process_english_attempt('RECEIPT_UUID'::uuid);
```

For malformed answer metadata, use the operator-only repair function. Supply the complete corrected payload and a reason. Keep the original attempt ID and occurrence timestamp unless those fields themselves are invalid. Never change the student's answer to make it correct.

```sql
select public.repair_english_attempt(
  id,
  coalesce(resolution_payload, payload) || jsonb_build_object('p_module', 1),
  'Corrected module metadata after checking the originating activity'
)
from public.english_attempt_inbox
where id = 'RECEIPT_UUID'::uuid and status = 'needs_review';
```

The original `payload` is retained. Every correction is recorded in `english_attempt_repairs`; scoring runs immediately after repair. Authenticated students cannot repair or process arbitrary receipts. Review cron execution with:

```sql
select d.status, d.return_message, d.start_time, d.end_time
from cron.job_run_details d
join cron.job j using (jobid)
where j.jobname = 'english-attempt-inbox-retry'
order by d.start_time desc limit 10;
```

## Verification

- `src/learning/wordProgress/store.test.ts` and `src/race/numberRecallStore.test.ts`: receipt acknowledgement, network failures, account changes, concurrent answers, pending history, legacy IDs.
- `supabase/tests/durable_attempt_inbox.sql`: missing catalogue and malformed answers survive, later recovery, audited repair, access restrictions, coin/leaderboard/word credit, original dates and duplicate safety. The test rolls back.
- `supabase/tests/legacy_practice_uploads.sql`: old phone IDs, repeated reps, settlement and dates remain compatible. The test rolls back.

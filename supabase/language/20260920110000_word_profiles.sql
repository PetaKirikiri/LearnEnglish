-- Target: SubtitleDisplay (gbsopnbovsxlstnmaaga), language data only.
alter table public.englishsuccess_words add column if not exists word_profile jsonb;
-- englishsuccess_language returns to_jsonb(row), so the profile accompanies the existing snapshot.

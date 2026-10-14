import { hotelQuestions } from '../src/hotel/course'

// Keep the server answer registry aligned with the exact shipped catalogue.
export function hotelScoringSql() {
  const rows = hotelQuestions.map(q => `('${q.id.replaceAll("'", "''")}', ${q.correct}, true)`)
  // Retain historical IDs so offline answers from the previous course can sync.
  // The client scheduler alone selects the active learning bank.
  return `begin;\ninsert into public.englishsuccess_hotel_questions(id,answer,active) values\n${rows.join(',\n')}\non conflict(id) do update set answer=excluded.answer,active=true;\ncommit;`
}

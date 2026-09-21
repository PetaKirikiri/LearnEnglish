import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { getQuizCatalogue } from './quizContent'
import { questionProgressKey } from './progressData'

it('registers every current question and its exact answer with server scoring', () => {
  const sql = ['20260914081000_current_scoring_keys.sql', '20260921170000_exam_practice.sql', '20260921180000_exam_audit.sql', '20260921220000_exam_depth.sql'].map(file => readFileSync(`supabase/migrations/${file}`, 'utf8')).join('\n')
  const catalogue = getQuizCatalogue()
  const quote = (s: string) => "'" + s.replaceAll("'", "''") + "'"
  for (const q of [...catalogue.sentences, ...catalogue.vocabulary]) {
    expect(sql, q.id).toContain(`(${quote(questionProgressKey(q))}, ${quote(q.answer)}, true)`)
  }
  expect(sql).not.toContain('insert into public.fifa_english_weekly_points')
})

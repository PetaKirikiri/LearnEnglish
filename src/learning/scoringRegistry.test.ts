import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { getQuizCatalogue } from './quizContent'
import { questionProgressKey } from './progressData'

it('registers every current question and its exact answer with server scoring', () => {
  const sql = ['20260914081000_current_scoring_keys.sql', '20260921170000_exam_practice.sql', '20260921180000_exam_audit.sql', '20260921220000_exam_depth.sql', '20260922070100_plain_reading_questions.sql', '20260922073100_plain_vocabulary_questions.sql'].map(file => readFileSync(`supabase/migrations/${file}`, 'utf8')).join('\n')
  const catalogue = getQuizCatalogue()
  // Later migrations replace earlier keys. An obsolete answer appearing anywhere
  // in the SQL must not satisfy this check after content has been revised.
  const keys = new Map([...sql.matchAll(/\('((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*true\)/g)]
    .map(match => [match[1].replaceAll("''", "'"), match[2].replaceAll("''", "'")]))
  for (const q of [...catalogue.sentences, ...catalogue.vocabulary]) {
    expect(keys.get(questionProgressKey(q)), q.id).toBe(q.answer)
  }
  expect(sql).not.toContain('insert into public.fifa_english_weekly_points')
})

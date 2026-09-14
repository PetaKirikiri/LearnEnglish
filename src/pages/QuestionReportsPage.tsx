import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { QuizQuestion } from '../learning/quizContent'
type Report = { id: string; question: QuizQuestion; reason: string; note: string; created_at: string }
export default function QuestionReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [status, setStatus] = useState('Loading flags…')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const all: Report[] = []
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await supabase.from('fifa_english_question_reports').select('id,question,reason,note,created_at').order('created_at', { ascending: false }).order('id').range(offset, offset + 999)
          if (error) throw error
          all.push(...data as Report[])
          if (data.length < 1000) break
        }
        if (active) { setReports(all); setStatus(all.length ? `${all.length} flags` : 'No questions flagged yet.') }
      } catch { if (active) setStatus('Could not load flags. Please try refreshing.') }
    })()
    return () => { active = false }
  }, [refresh])
  return <section className="mx-auto max-w-3xl space-y-4">
    <header className="rounded-3xl bg-white p-6"><h1 className="text-3xl font-black">Flagged questions</h1><p role="status" className="mt-3 text-sm text-slate-600">{status}</p><button onClick={() => { setStatus('Loading flags…'); setRefresh(value => value + 1) }} className="mt-3 font-bold text-blue-700">Refresh</button></header>
    {reports.map(report => <article key={report.id} className="space-y-3 rounded-3xl bg-white p-6">
      <p className="text-sm font-bold text-amber-700">⚑ {report.reason}</p>
      <h2 className="text-xl font-black">{report.question.prompt}</h2>
      <p className="text-sm text-slate-500">{report.question.instruction}</p>
      {report.question.thaiPrompt && <p lang="th">{report.question.thaiPrompt}</p>}
      <p>Choices: {report.question.choices.join(' · ')}</p>
      <p className="font-bold">Expected answer: {report.question.answer}</p>
      {report.note && <p className="whitespace-pre-wrap rounded-xl bg-amber-50 p-4">{report.note}</p>}
      <p className="text-sm text-slate-500">From “{report.question.sourceTitle}”: {report.question.example}</p>
      <p className="text-xs text-slate-400">{new Date(report.created_at).toLocaleString()}</p>
    </article>)}
  </section>
}

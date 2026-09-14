import { useId, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import Icon from '../ui/Icon'
import type { QuizQuestion } from './quizContent'
import { questionProgressKey } from './progressData'

export default function QuestionFlag({ question, userId, onOpenChange }: { question: QuizQuestion; userId: string; onOpenChange?: (open: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('More than one answer fits')
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [reportId] = useState(() => crypto.randomUUID())
  function close() { dialog.current?.close(); setOpen(false); onOpenChange?.(false) }
  async function submit() {
    setState('saving')
    try {
      const { error } = await supabase.from('fifa_english_question_reports').insert({ id: reportId, learner_id: userId, question_id: questionProgressKey(question), question, reason, note: note.trim() })
      if (error && error.code !== '23505') throw error
      setState('saved'); close()
    } catch { setState('error') }
  }
  return <div onKeyDown={event => event.stopPropagation()}>
    <button type="button" aria-label={state === 'saved' ? 'Flag sent' : 'Flag this question'} title="Flag this question" aria-haspopup="dialog" aria-expanded={open} disabled={state === 'saved'} onClick={() => { setOpen(true); onOpenChange?.(true); dialog.current?.showModal() }} className="icon-button">
      <Icon name={state === 'saved' ? 'check' : 'flag'} />
    </button>
    <dialog ref={dialog} className="report-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (state !== 'saving') close() }} onClick={event => { if (event.target === event.currentTarget && state !== 'saving') { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close() } }}>
      <div className="mb-5 flex items-center justify-between gap-4"><h2 id={titleId} className="text-xl font-bold">Flag question</h2><button type="button" disabled={state === 'saving'} aria-label="Close report" className="icon-button" onClick={close}><Icon name="close" /></button></div>
      <p className="mb-5 rounded-xl bg-slate-50 p-3 text-sm leading-6">{question.prompt}</p>
      <div className="space-y-3" role="group" aria-label="Reason">{['More than one answer fits', 'Doesn’t make sense', 'Other'].map(value => <button key={value} disabled={state === 'saving'} type="button" aria-pressed={reason === value} onClick={() => setReason(value)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm font-semibold ${reason === value ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-slate-200'}`}>{value}{reason === value && <Icon name="check" />}</button>)}</div>
      <textarea aria-label="Note (optional)" placeholder="Note (optional)" value={note} disabled={state === 'saving'} maxLength={1000} onChange={event => setNote(event.target.value)} rows={3} className="mt-4 block w-full rounded-xl border border-slate-300 p-3 text-base" />
      {state === 'error' && <p role="alert" className="mt-3 text-sm text-red-800">The flag wasn’t sent. Try again; your note is still here.</p>}
      <button type="button" disabled={state === 'saving'} onClick={() => void submit()} className="primary-action mt-5 w-full">{state === 'saving' ? 'Sending…' : 'Send flag'}</button>
    </dialog>
    {state === 'saved' && <span role="status" className="sr-only">Saved for Peta to review.</span>}
  </div>
}

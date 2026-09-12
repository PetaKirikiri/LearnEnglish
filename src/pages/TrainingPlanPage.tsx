import { useEffect, useMemo, useState } from 'react'
import { buildTrainingPlan, exampleEvidence } from '../learning/trainingPlan'
import { loadLearnerEvents } from '../learning/progressSync'
import { summarizeProgress, type ProgressEvent } from '../learning/progressData'
import { parseWords } from '../lib/wordData'
import { supabase } from '../lib/supabase'

const plan = buildTrainingPlan()
const steps = [
  ['1', 'Choose the next word', 'Start at the highest-frequency unfinished word.'],
  ['2', 'Practise its meanings', 'Use each story sentence, with Thai meaning and clear context.'],
  ['3', 'Prove each example', 'Get each sentence right in three separate rounds. Mistakes return.'],
  ['4', 'Check it later', 'Answer again in a later session without hints.'],
  ['5', 'Move down the list', 'Advance to the next word; revisit learned words occasionally.'],
] as const

function Highlight({ text, word }: { text: string; word: string }) {
  return <>{text.split(/(\p{L}+(?:[’']\p{L}+)*)/gu).map((part, index) => parseWords(part)[0] === word
    ? <mark key={index} className="rounded bg-yellow-100 px-0.5 font-bold text-slate-950">{part}</mark>
    : part)}</>
}

export default function TrainingPlanPage() {
  const [selectedWord, setSelectedWord] = useState(plan[0].word)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [examplePage, setExamplePage] = useState(0)
  const [events, setEvents] = useState<ProgressEvent[]>([])
  const [reportStatus, setReportStatus] = useState('Loading FIFA’s saved practice…')
  const [loaded, setLoaded] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const records = useMemo(() => summarizeProgress(events).items, [events])
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const { data, error } = await supabase.rpc('fifa_english_learners')
        if (error) throw error
        const fifa = (data as { id: string; display_name: string }[]).find(learner => learner.display_name?.toLowerCase() === 'fifa')
        if (!fifa) throw new Error('FIFA’s progress requires an administrator account.')
        const saved = await loadLearnerEvents(fifa.id)
        if (!active) return
        setEvents(saved)
        setLoaded(true)
        setReportStatus(saved.length ? 'FIFA’s recorded sentence practice is shown below.' : 'FIFA has no synced practice yet. The path below is the proposed order.')
      } catch {
        if (!active) return
        setLoaded(false)
        setReportStatus('FIFA’s saved practice could not be loaded. Sign in as an administrator and refresh. The proposed order is still available.')
      }
    })()
    return () => { active = false }
  }, [refresh])

  const selected = plan.find(item => item.word === selectedWord)!
  const filtered = plan.filter(item => item.word.includes(query.trim().toLowerCase()))
  const tested = selected.examples.filter(example => example.questions.length).length
  const passed = selected.examples.filter(example => exampleEvidence(example, records).rounds >= 3).length
  const next = plan[selected.rank]
  const coverage = plan.filter(item => item.examples.some(example => example.questions.length)).length

  function choose(word: string) { setSelectedWord(word); setExamplePage(0) }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl bg-white p-6 sm:p-8">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Proposed path · Not active in lessons yet</span>
        <h1 className="mt-4 text-3xl font-black">How FIFA will work through the words</h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">Most frequent first. Each word opens into its story sentences. He progresses after demonstrating that word across every example, then remembering it later.</p>
        <ol aria-label="Proposed training sequence" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map(([number, title, description]) => <li key={number} className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4"><span className="mb-3 grid h-8 w-8 place-items-center rounded-full bg-blue-700 text-sm font-black text-white">{number}</span><h2 className="font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></li>)}
        </ol>
        <details className="mt-5 rounded-xl border border-slate-200 p-4 text-sm leading-6"><summary className="cursor-pointer font-bold">What the live app does today</summary><p className="mt-2">Each round contains 10 authored grammar questions with Thai meaning and explanations. It first includes up to five previously missed questions, then adds a mix from different stories. It does not yet follow frequency order or require every sentence for a word before advancing.</p><p className="mt-2">Three correct rounds per question are recorded today. Old story-recall answers do not count toward the new grammar questions. Full example coverage and the later-session check are still needed for this proposed path. Nouns, main verbs, and adjectives belong in vocabulary practice, not random sentence blanks.</p></details>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[['Word priorities', plan.length, 'Whole-corpus reference; includes vocabulary words'], ['Words with a current sentence exercise', coverage, 'Grammar targets with authored choices and Thai guidance'], ['Words without a current sentence exercise', plan.length - coverage, 'Includes content words intended for vocabulary practice']].map(([label, count, note]) => <div key={label} className="rounded-2xl bg-white p-5"><p className="text-sm font-bold text-slate-600">{label}</p><strong className="mt-2 block text-3xl">{count}</strong><p className="mt-2 text-xs leading-5 text-slate-500">{note}</p></div>)}
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-bold text-blue-900">First in the proposed order</p>
        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="First ten words">{plan.slice(0, 10).map((item, index) => <span key={item.word} className="flex items-center gap-2"><button onClick={() => choose(item.word)} type="button" className={`rounded-xl border px-3 py-2 text-left ${selected.word === item.word ? 'border-blue-700 bg-blue-700 text-white' : 'border-blue-200 bg-white text-blue-950'}`}><strong>#{item.rank} {item.word}</strong><span className="ml-2 text-xs">{item.frequency}×</span></button>{index < 9 && <span aria-hidden="true" className="text-blue-400">→</span>}</span>)}</div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600"><p role="status">{reportStatus}</p><button type="button" onClick={() => setRefresh(value => value + 1)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-blue-700">Refresh practice data</button></div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(280px,1fr)_minmax(0,2fr)]">
        <section className="overflow-hidden rounded-3xl bg-white">
          <div className="p-5"><h2 className="text-xl font-black">Word order</h2><label className="mt-4 block text-sm font-bold">Find a word<input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(0) }} placeholder="Try them…" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" /></label><p className="mt-3 text-xs leading-5 text-slate-500">Frequency includes story titles. Examples below are complete sentences from story paragraphs. Counts differ because a word can appear several times in one sentence.</p></div>
          <div className="max-h-[32rem] overflow-y-auto" aria-label="Frequency-ranked word list">{filtered.slice(page * 20, (page + 1) * 20).map(item => <button key={item.word} type="button" aria-pressed={selected.word === item.word} onClick={() => choose(item.word)} className={`flex w-full items-start gap-3 border-t border-slate-100 px-5 py-4 text-left ${selected.word === item.word ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50'}`}><span className="w-9 shrink-0 text-sm text-slate-500">#{item.rank}</span><span className="flex-1"><strong className="text-lg">{item.word}</strong><span className="mt-1 block text-xs text-slate-500">{item.examples.length} source examples · {item.examples.filter(example => example.questions.length).length} with exercises</span></span><span className="text-sm font-bold">{item.frequency}×</span></button>)}</div>
          {!filtered.length && <p className="p-5 text-sm text-slate-500">No matching word.</p>}
          <nav aria-label="Word order pages" className="flex items-center justify-between gap-2 border-t border-slate-100 p-4 text-sm"><button disabled={page === 0} onClick={() => setPage(value => value - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-30">Previous</button><span>{page + 1} / {Math.max(1, Math.ceil(filtered.length / 20))}</span><button disabled={(page + 1) * 20 >= filtered.length} onClick={() => setPage(value => value + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-30">Next</button></nav>
        </section>

        <section aria-label="Selected word training" className="min-w-0 space-y-4">
          <header className="rounded-3xl bg-blue-950 p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Proposed priority #{selected.rank}</p><h2 className="mt-2 text-4xl font-black">{selected.word}</h2><p className="mt-3 text-sm text-blue-100">{selected.frequency} appearances · {selected.examples.length} distinct story sentences</p>
            <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/10 p-3"><strong className="block text-2xl">{tested} / {selected.examples.length}</strong><span className="text-xs text-blue-100">Examples with current exercises</span></div><div className="rounded-xl bg-white/10 p-3"><strong className="block text-2xl">{loaded ? `${passed} / ${selected.examples.length}` : '—'}</strong><span className="text-xs text-blue-100">Examples with 3 correct rounds</span></div></div>
            <p className="mt-4 text-sm leading-6 text-blue-100">Advance when every example is demonstrated and a later-session check is passed. {next ? `Next priority: #${next.rank} “${next.word}”.` : 'This is the final word in the proposed list.'}</p>
          </header>
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{selected.examples.length === 0 ? 'This word occurs in a title, heading, or other text without a complete sentence. ' : `${tested} of ${selected.examples.length} examples have an authored grammar exercise. `}This list includes vocabulary words: not every word should become a sentence blank. Grammar exercises include Thai meaning and explanations. The frequency-first progression and later-session check are not implemented.</p>
          {selected.examples.slice(examplePage * 10, (examplePage + 1) * 10).map((example, index) => {
            const evidence = exampleEvidence(example, records)
            return <article key={`${selected.word}:${example.id}`} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-slate-500">Example {examplePage * 10 + index + 1} · Chapter {example.chapter}</p><span className={`rounded-full px-3 py-1 text-xs font-bold ${evidence.rounds === 3 && loaded ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{example.questions.length === 0 ? 'No exercise yet' : loaded ? evidence.status : 'Practice data unavailable'}</span></div>
              <p className="mt-4 text-lg leading-8"><Highlight text={example.text} word={selected.word} /></p><p className="mt-2 text-xs text-slate-500">{example.story}</p>
              <details className="mt-4 text-sm"><summary className="cursor-pointer font-bold text-blue-700">Show paragraph context</summary><p className="mt-3 whitespace-pre-line leading-7 text-slate-600"><Highlight text={example.context} word={selected.word} /></p></details>
              {example.questions.map(question => <details key={question.id} className="mt-4 rounded-xl border border-slate-200 p-4 text-sm"><summary className="cursor-pointer font-bold">Inspect current exercise{loaded ? ` · ${Math.min(3, records.get(question.id)?.correctRounds.size ?? 0)} / 3 correct rounds` : ''}</summary><p className="mt-3 font-bold text-blue-800">{question.grammarFocus}</p><p lang="th" className="mt-3 leading-7">{question.thaiPrompt}</p><p className="mt-3 text-base font-bold">{question.prompt}</p><div className="mt-3 flex flex-wrap gap-2">{question.choices.map(choice => <span key={choice} className={`rounded-lg border px-3 py-2 ${choice === question.answer ? 'border-blue-300 bg-blue-50 font-bold' : 'border-slate-200'}`}>{choice}{choice === question.answer ? ' · correct' : ''}</span>)}</div><p lang="th" className="mt-3 leading-7">{question.explanationThai}</p><p className="mt-3 text-sm leading-6 text-slate-600">{question.explanation}</p></details>)}
            </article>
          })}
          {selected.examples.length > 10 && <nav aria-label="Example pages" className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 text-sm"><button disabled={examplePage === 0} onClick={() => setExamplePage(value => value - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-30">Previous examples</button><span>{examplePage + 1} / {Math.ceil(selected.examples.length / 10)}</span><button disabled={(examplePage + 1) * 10 >= selected.examples.length} onClick={() => setExamplePage(value => value + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-30">Next examples</button></nav>}
        </section>
      </div>
    </section>
  )
}

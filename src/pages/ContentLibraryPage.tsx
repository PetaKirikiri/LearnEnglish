import { useState } from 'react'
import { readings } from '../content/readings'
import { thaiTranslations } from '../content/thaiTranslations.generated'
import { getQuizCatalogue, type QuizQuestion } from '../learning/quizContent'
import { buildWordData, parseWords } from '../lib/wordData'

const catalogue = getQuizCatalogue()
const wordData = buildWordData(readings)
const vocabularyByWord = new Map(catalogue.vocabulary.map(question => [question.spokenText, question]))
const sentenceCount = new Set(catalogue.sentences.map(question => question.example)).size
const pageSize = 30
type View = 'stories' | 'words' | 'vocabulary' | 'sentences'

function thaiMeaning(question: QuizQuestion) {
  return question.prompt === question.spokenText ? question.answer : question.prompt
}

function Exercise({ question }: { question: QuizQuestion }) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-5">
      <summary className="cursor-pointer break-words font-bold marker:text-blue-600">
        {question.mode === 'vocabulary' ? question.spokenText : question.prompt}
        <span className="mt-2 block text-sm font-normal text-slate-500">{question.sourceTitle} · Answer: {question.answer}</span>
      </summary>
      <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
        <div><p className="text-xs font-bold uppercase text-slate-500">Learner sees · {question.instruction}</p><p className="mt-1 text-xl font-bold">{question.prompt}</p></div>
        <div className="flex flex-wrap gap-2" aria-label="Answer choices">
          {question.choices.map(choice => <span key={choice} className={`rounded-xl border px-3 py-2 ${choice === question.answer ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200'}`}>{choice}{choice === question.answer ? ' ✓' : ''}</span>)}
        </div>
        <div><p className="text-xs font-bold uppercase text-slate-500">Full source sentence</p><p className="mt-1 leading-7">{question.example}</p></div>
        {question.mode === 'vocabulary'
          ? <div><p className="text-xs font-bold uppercase text-slate-500">Lesson Thai meaning</p><p lang="th" className="mt-1 text-lg">{thaiMeaning(question)}</p></div>
          : <div className="space-y-3"><p className="font-bold">{question.grammarFocus}</p><p lang="th">{question.thaiPrompt}</p><p lang="th">{question.explanationThai}</p><p className="text-sm text-slate-600">{question.explanation}</p></div>}
        <div><p className="mb-2 text-xs font-bold uppercase text-slate-500">English audio</p><audio controls preload="none" src={question.audioUrl} className="w-full max-w-sm">Your browser does not support audio playback.</audio></div>
      </div>
    </details>
  )
}

export default function ContentLibraryPage() {
  const [view, setView] = useState<View>('stories')
  const [search, setSearch] = useState('')
  const [story, setStory] = useState('')
  const [page, setPage] = useState(0)
  const query = search.trim().toLocaleLowerCase()
  const matches = (...values: string[]) => values.join(' ').toLocaleLowerCase().includes(query)
  const selectedReadings = readings.filter(reading => !story || reading.title === story)
  const storyWords = new Set(selectedReadings.flatMap(reading => parseWords([reading.title, ...reading.paragraphs].join(' '))))
  const filteredStories = selectedReadings.filter(reading => matches(reading.title, ...reading.paragraphs))
  const filteredWords = wordData.ranking.filter(({ word }) => storyWords.has(word) && matches(word, thaiTranslations[word] ?? ''))
  const filteredQuestions = (view === 'vocabulary' ? catalogue.vocabulary : catalogue.sentences).filter(question => (
    (!story || question.sourceTitle === story) && matches(question.prompt, question.answer, question.example, question.sourceTitle, question.thaiPrompt ?? '', question.grammarFocus ?? '', ...question.choices)
  ))
  const count = view === 'stories' ? filteredStories.length : view === 'words' ? filteredWords.length : filteredQuestions.length
  const pageCount = Math.max(1, Math.ceil(count / pageSize))
  const start = page * pageSize
  const tabs: { id: View; label: string; count: number }[] = [
    { id: 'stories', label: 'Stories', count: readings.length },
    { id: 'words', label: 'All words', count: wordData.uniqueWords },
    { id: 'vocabulary', label: 'Vocabulary exercises', count: catalogue.vocabulary.length },
    { id: 'sentences', label: 'Sentence questions', count: catalogue.sentences.length },
  ]

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Course content</p>
        <h1 className="mt-2 text-3xl font-black">Content Library</h1>
        <p className="mt-3 text-slate-600">Browse everything saved in the course and inspect the exercises FIFA can receive.</p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {tabs.map(tab => <button key={tab.id} type="button" onClick={() => { setView(tab.id); setPage(0) }} aria-pressed={view === tab.id} className={`rounded-2xl border p-4 text-left ${view === tab.id ? 'border-blue-700 bg-blue-50 text-blue-900' : 'border-slate-200 hover:bg-slate-50'}`}><strong className="block text-3xl">{tab.count}</strong><span className="mt-1 block text-sm">{tab.label}</span></button>)}
        </div>
        <p className="mt-4 text-sm text-slate-500">{wordData.totalWords.toLocaleString()} total words including titles · {sentenceCount} distinct sentences used in exercises · 10 questions per practice round</p>
      </header>

      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
        <p><strong>Sentence structures:</strong> Individually authored grammar questions with Thai meanings and explanations. No random noun substitutions. Old story-recall scores do not count as mastery of these new exercises.</p>
        <p><strong>Content gaps:</strong> Chapter 6 has not been supplied separately. Tap-for-word explanations and grammar exercises for every source sentence have not been added.</p>
        <p>The vocabulary exercises use selected Thai meanings. The larger word dictionary contains automatic translations that still need review.</p>
        <p><strong>Completion:</strong> Open Progress to see each learner’s words, mistakes, activity, and mastery of the current exercises.</p>
      </aside>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold">Search {tabs.find(tab => tab.id === view)?.label.toLowerCase()}<input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(0) }} placeholder="English, Thai, or story text…" className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal" /></label>
        <label className="text-sm font-bold">Story<select value={story} onChange={event => { setStory(event.target.value); setPage(0) }} className="mt-2 block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"><option value="">All stories</option>{readings.map(reading => <option key={reading.id} value={reading.title}>Chapter {reading.chapter} · {reading.title}</option>)}</select></label>
      </div>
      <p role="status" className="text-sm text-slate-600">{count === 0 ? 'No matching content.' : `Showing ${start + 1}–${Math.min(start + pageSize, count)} of ${count}`}{view === 'vocabulary' && story ? ' · Filtered by the exercise’s example story.' : ''}</p>

      {view === 'stories' ? <div className="space-y-3">{filteredStories.slice(start, start + pageSize).map(reading => <details key={reading.id} className="rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-bold marker:text-blue-600">Chapter {reading.chapter} · {reading.title}<span className="mt-2 block text-sm font-normal text-slate-500">{buildWordData([reading]).totalWords} words · {catalogue.sentences.filter(question => question.sourceTitle === reading.title).length} sentence questions</span></summary><div className="mt-5 space-y-4 border-t border-slate-100 pt-5 leading-8">{reading.paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}</div></details>)}</div>
        : view === 'words' ? <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><caption className="p-4 text-left text-slate-500">Counts are across the whole course. “In lessons” identifies words included in vocabulary exercises.</caption><thead className="bg-slate-100"><tr><th className="p-4">Word</th><th className="p-4">Thai dictionary meaning</th><th className="p-4">Count</th><th className="p-4">In lessons</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredWords.slice(start, start + pageSize).map(({ word, count: frequency }) => { const exercise = vocabularyByWord.get(word); return <tr key={word}><td className="p-4 font-bold">{word}</td><td className="p-4"><span lang="th">{thaiTranslations[word] || 'Not added'}</span>{exercise && <span className="mt-1 block text-xs text-blue-800">Lesson meaning: <span lang="th">{thaiMeaning(exercise)}</span></span>}</td><td className="p-4">{frequency}</td><td className="p-4">{exercise ? 'Yes' : 'No'}</td></tr> })}</tbody></table></div>
          : <div className="space-y-3">{filteredQuestions.slice(start, start + pageSize).map(question => <Exercise key={question.id} question={question} />)}</div>}

      {pageCount > 1 && <nav aria-label="Content pages" className="flex items-center justify-between gap-3 pb-6"><button type="button" disabled={page === 0} onClick={() => setPage(value => value - 1)} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold disabled:opacity-40">Previous</button><span className="text-sm">Page {page + 1} of {pageCount}</span><button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage(value => value + 1)} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold disabled:opacity-40">Next</button></nav>}
    </section>
  )
}

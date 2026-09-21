import { useMemo, useState } from 'react'
import { createPracticeRound } from '../learning/quizContent'
import { orderedQuestionBank, questionFrequency, questionWord, questionExampleCount } from '../learning/questionSheet'

import { questionBlock } from '../learning/contentOrder'
import { recordAnswer, type LearningMemory } from '../learning/learningMemory'

const bank=orderedQuestionBank()
const blocks=[...new Set(bank.map(({question})=>questionBlock(question)))]
export default function QuestionsTablePage() {
  const [search,setSearch]=useState('')
  const [mode,setMode]=useState('')
  const [view,setView]=useState('bank')
  const [round,setRound]=useState(1)
  const [focusPair,setFocusPair]=useState(1)
  const previewMemory=useMemo(()=>{
    let memory: LearningMemory={}
    const earlier=new Set(blocks.slice(0,(focusPair-1)*2))
    for(let pass=0;pass<2;pass++) for(const {question} of bank) if(earlier.has(questionBlock(question))) memory=recordAnswer(memory,question,true,pass+1,`preview-${pass}`)
    return memory
  },[focusPair])
  const [expanded,setExpanded]=useState<string | null>(null)
  const source=view==='bank' ? bank : createPracticeRound(round-1,previewMemory).map((question,index)=>({question,order:index+1}))
  const query=search.trim().toLowerCase()
  const rows=source.filter(({question:q})=>(!mode || q.mode===mode) && [q.prompt,q.answer,q.sourceTitle,q.grammarFocus,...q.choices].join(' ').toLowerCase().includes(query))
  return <section>
    <div className="sheet-toolbar"><h1>Content <span>{bank.length} questions</span></h1><label><span className="sr-only">Question view</span><select value={view} onChange={e=>setView(e.target.value)}><option value="bank">All questions · frequency priority</option><option value="round">Round preview · playing order</option></select></label>{view==='round' && <label className="flex items-center gap-2 text-sm">Round<input type="number" min="1" max="999" className="!w-20" value={round} onChange={e=>setRound(Math.max(1,Math.min(999,Number(e.target.value)||1)))} /></label>}{view==='round' && <label className="flex items-center gap-2 text-sm">Focus pair<input aria-label="Focus pair" type="number" min="1" max={Math.ceil(blocks.length/2)} className="!w-20" value={focusPair} onChange={e=>setFocusPair(Math.max(1,Math.min(Math.ceil(blocks.length/2),Number(e.target.value)||1)))} /></label>}<label><span className="sr-only">Question type</span><select value={mode} onChange={e=>setMode(e.target.value)}><option value="">All types</option><option value="sentences">Particles</option><option value="vocabulary">Vocabulary</option></select></label><label><span className="sr-only">Search questions</span><input type="search" placeholder="Search questions / answers" value={search} onChange={e=>setSearch(e.target.value)} /></label></div>
    <p className="sheet-note">{view==='bank' ? 'Two targets together · Two correct passes per example unlock the next pair · Earlier targets stay in review.' : 'Preview: selected focus pair plus earlier review. Actual examples adapt to saved progress.'}</p>
    <div className="sheet-scroll"><table className="data-sheet question-sheet"><caption className="sr-only">All questions and answers in {view==='bank' ? 'frequency priority' : 'round'} order</caption><thead><tr>{['#','Type','Target','Other options','Answer','Question shown','Frequency','Examples','Source','Details'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(({question:q,order})=><tr key={q.id}><td className="sheet-number">{order}</td><td>{q.mode==='vocabulary' ? 'Vocabulary' : 'Particles'}</td><td className="font-semibold">{questionWord(q)}</td><td className="other-options-cell">{q.choices.filter(choice=>choice!==q.answer).join(' · ')}</td><td className="correct-cell font-semibold">{q.answer}</td><td className="question-cell">{q.prompt}</td><td>{questionFrequency(q).count}</td><td>{questionExampleCount(q)}</td><td>{q.sourceTitle}</td><td><button aria-expanded={expanded===q.id} onClick={()=>setExpanded(expanded===q.id ? null : q.id)}>Inspect</button>{expanded===q.id && <div className="mt-3 min-w-72 space-y-2"><p>{q.instruction}</p><p>{q.example}</p>{q.thaiPrompt && <p lang="th">{q.thaiPrompt}</p>}{q.explanation && <p>{q.explanation}</p>}{q.explanationThai && <p lang="th">{q.explanationThai}</p>}<audio aria-label="Question audio" controls preload="none" src={q.audioUrl} /><code className="break-all text-xs">{q.id}</code></div>}</td></tr>)}</tbody></table>{!rows.length && <p className="p-5 text-sm">No matching questions.</p>}</div>
    <p role="status" className="sheet-note">{rows.length} of {source.length} questions · All rows shown · Green cells are correct answers</p>
  </section>
}

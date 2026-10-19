import { useState } from 'react'
import { getCurriculum } from './database'
import { levels } from './schema'
import '../hotel/hotel-content.css'
import './curriculum.css'

export default function CurriculumPage() {
  const data=getCurriculum()
  const [level,setLevel]=useState('All')
  const [view,setView]=useState<'structures'|'vocabulary'>('structures')
  const [search,setSearch]=useState('')
  if(!data) return <p role="alert">Curriculum unavailable.</p>
  const query=search.trim().toLowerCase()
  const nodeById=new Map(data.skills.map(n=>[n.id,n]))
  const questionById=new Map(data.questions.map(q=>[q.id,q]))
  const vocabularyByWord=new Map(data.vocabulary.map(w=>[w.word,w]))
  const nodes=[...data.skills].sort((a,b)=>a.order-b.order).filter(s=>level==='All'||s.level===level)
  const structures=data.structures.filter(s=>nodes.some(n=>n.id===s.nodeId))
    .filter(s=>!query||[nodeById.get(s.nodeId)!.title,...s.frames,...s.vocabulary,...s.questionIds.map(id=>questionById.get(id)!.english)].join(' ').toLowerCase().includes(query))
    .sort((a,b)=>nodeById.get(a.nodeId)!.order-nodeById.get(b.nodeId)!.order)
  const words=data.vocabulary.filter(w=>(level==='All'||nodeById.get(w.firstNodeId)!.level===level)&&(!query||`${w.word} ${w.thai}`.toLowerCase().includes(query)))
    .sort((a,b)=>nodeById.get(a.firstNodeId)!.order-nodeById.get(b.firstNodeId)!.order||a.word.localeCompare(b.word))
  const questionLink=(nodeId:string)=>`${window.location.pathname.replace(/\/curriculum\/?$/,'/content')}?focus=${encodeURIComponent(nodeId)}`
  return <section className="hotel-content curriculum">
    <div className="curriculum-toolbar"><h1>Curriculum</h1><label>Level <select value={level} onChange={e=>setLevel(e.target.value)}><option>All</option>{levels.map(l=><option key={l}>{l}</option>)}</select></label></div>
    <nav className="curriculum-tabs" aria-label="Curriculum views">
      <button aria-pressed={view==='structures'} onClick={()=>setView('structures')}>Structures <small>{data.structures.reduce((n,s)=>n+s.frames.length,0)}</small></button>
      <button aria-pressed={view==='vocabulary'} onClick={()=>setView('vocabulary')}>Vocabulary <small>{data.vocabulary.length}</small></button>
    </nav>
    <input className="curriculum-search" aria-label="Search curriculum" placeholder={view==='structures'?'Find a pattern or sentence':'Find a word'} value={search} onChange={e=>setSearch(e.target.value)}/>
    {view==='structures'?<div className="curriculum-sections">
      {structures.map(s=>{
        const node=nodeById.get(s.nodeId)!
        const items=s.questionIds.map(id=>questionById.get(id)!)
        const general=items.filter(q=>q.grammar.domain)
        const examples=(general.length?general:items).slice(0,2)
        return <details key={s.id} className="curriculum-section" open={node.order===0}>
          <summary><span className="curriculum-order">{node.order+1}</span><span>{node.title}<small>{node.level} route · Introductory · {s.questionIds.length} questions</small></span></summary>
          <div className="curriculum-detail">
            <ul className="curriculum-frames">{s.frames.map(frame=><li key={frame}>{frame}</li>)}</ul>
            <div className="curriculum-examples">{examples.map(q=><div key={q.id}>
              <p className="curriculum-example">{q.english}</p>
              <p lang="th">{q.grammar.thai??q.answers[q.correct].map(a=>a.text).join('')}</p>
            </div>)}</div>
            <p className="curriculum-focus"><span>Focus</span> {s.focusWords.join(' · ')}</p>
            <a href={questionLink(node.id)}>All {s.questionIds.length} questions & choices →</a>
            <details className="curriculum-word-list"><summary>Words in these sentences · {s.vocabulary.length}</summary><dl>{s.vocabulary.map(w=><div key={w}><dt>{w}</dt><dd lang="th">{vocabularyByWord.get(w)?.thai}</dd></div>)}</dl></details>
            <details className="curriculum-teaching"><summary>Sequence & reference</summary>
              <p>{node.thaiBridge}</p>
              <p>Before this: {node.prerequisites.length?node.prerequisites.map(id=>nodeById.get(id)!.title).join(' · '):'Starting section'}</p>
              <p>Introductory coverage. These exercises do not establish the whole CEFR level.</p>
              {node.references.map(r=><p key={r.sourceId}><a href={data.sources.find(source=>source.id===r.sourceId)!.url} target="_blank" rel="noreferrer">{data.sources.find(source=>source.id===r.sourceId)!.title}</a><br/>{r.locator}</p>)}
            </details>
          </div>
        </details>
      })}
      {!structures.length&&<p>No matching structures.</p>}
    </div>:<>
      <p className="curriculum-note">Ordered by first use in this course, not a published CEFR vocabulary list.</p>
      <div className="hotel-content-scroll" role="region" aria-label="Course vocabulary" tabIndex={0}><table className="curriculum-vocabulary"><thead><tr><th>Word</th><th>Thai meaning</th><th>First section</th><th>Used in</th></tr></thead><tbody>{words.map(w=>{
        const node=nodeById.get(w.firstNodeId)!
        return <tr key={w.word}><td>{w.word}</td><td lang="th">{w.thai}</td><td><a href={questionLink(node.id)}>{node.order+1}. {node.title}</a></td><td>{w.structureIds.length} sections</td></tr>
      })}</tbody></table></div>
      {!words.length&&<p>No matching words.</p>}
    </>}
    <details className="curriculum-references"><summary>About this route</summary><p>{data.questions.length} questions. Two active focuses, prerequisite checks and recurring review. Section readiness requires repeated unaided answers and transfer contexts; retention is checked after a day.</p><p>Levels are provisional teaching bands, not CEFR certification. This is an introductory route, not a complete A1–C1 course.</p>{data.sources.map(s=><p key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a><br/><small>{s.use}</small></p>)}</details>
  </section>
}

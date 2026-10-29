import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import Icon, { type IconName } from '../ui/Icon'
import CurriculumPage from '../curriculum/CurriculumPage'
import HotelContentPage from '../hotel/HotelContentPage'
import { HotelLesson, type ListeningCourse } from '../hotel/HotelPage'
import { hotelQuestions, skillNames, skills } from '../hotel/course'
import { supabase } from '../lib/supabase'
import { englishScoring } from '../english/scoring'
import { homeworkQuestion, lessonQuestions, lessonSchema, readLessons, saveLesson, type ClassLesson } from './lessons'
import { classOneSkill } from './classOne'
import { classOnePractice } from './classOnePractice'
import './portal.css'
const LessonDocument = lazy(()=>import('./LessonDocument'))
const ClassOneMaterial = lazy(()=>import('./ClassOneMaterial'))

type Props = { userId: string; teacher: boolean; preview: boolean; course: ListeningCourse }
type View = 'lessons' | 'homework' | 'vocabulary' | 'structures' | 'leaderboard' | 'content' | 'document'
const navigation: { id: View; label: string; icon: IconName }[] = [
  {id:'lessons',label:'Lessons',icon:'book'}, {id:'homework',label:'Homework',icon:'play'},
  {id:'vocabulary',label:'Vocabulary',icon:'sound'}, {id:'structures',label:'Sentence structures',icon:'grid'},
  {id:'leaderboard',label:'Leaderboard',icon:'trophy'}, {id:'content',label:'Content',icon:'book'},
]
const navigationArt: Partial<Record<View,string>> = {lessons:'lessons-v1.png',homework:'practice-v1.png',vocabulary:'vocabulary-v1.png',structures:'structures-v1.webp',content:'lessons-v1.png'}
export default function MyLearning({userId, teacher, preview, course}: Props) {
  const base = `/english/${preview ? 'preview/' : ''}learning`
  const [search,setSearch]=useState(()=>location.search)
  const params = new URLSearchParams(search)
  const [homeworkTarget,setHomeworkTarget]=useState<string|null>(()=>params.get('view')==='homework'?(params.get('lesson')??'general'):null)
  function updateRoute(query:string) {
    setSearch(query)
    const next=new URLSearchParams(query)
    if(next.get('view')==='homework')setHomeworkTarget(next.get('lesson')??'general')
  }
  useEffect(()=>{
    const back=()=>updateRoute(location.search)
    window.addEventListener('popstate',back)
    return ()=>window.removeEventListener('popstate',back)
  },[])
  const requested = params.get('view') ?? 'lessons'
  const view = (requested==='document'||navigation.some(item => item.id === requested)) && (teacher || requested !== 'content') ? requested as View : 'lessons'
  const [lessons,setLessons] = useState<ClassLesson[] | null>(null)
  const [error,setError] = useState(''), [revision,setRevision] = useState(0)
  const [editing,setEditing] = useState<ClassLesson | null>(null)
  const [creating,setCreating] = useState(false)
  useEffect(() => {
    let active = true
    readLessons(preview).then(rows => { if(active) {setLessons(rows);setError('')} }).catch(cause => {if(active) setError(cause.message)})
    return () => {active=false}
  },[preview,userId,revision])
  const visible = lessons?.filter(row => teacher || row.published) ?? []
  const selected = visible.find(row => row.id === params.get('lesson'))
  const homeworkLesson=visible.find(row=>row.id===homeworkTarget)
  const href = (target: View, id?: string) => `${base}?view=${target}${id ? `&lesson=${encodeURIComponent(id)}` : ''}`
  async function addLesson() {
    if(creating||!lessons)return
    setCreating(true)
    const number=Math.max(0,...visible.map(l=>l.number))+1
    const lesson:ClassLesson={id:crypto.randomUUID(),number,title:`Lesson ${number}`,date:'',skills:[],published:false}
    try{await saveLesson(lesson,preview);location.assign(href('document',lesson.id))}catch(cause){setError(cause instanceof Error?cause.message:'Could not create lesson.');setCreating(false)}
  }
  const pageTitle=selected && (view==='document'||view==='homework') ? selected.title : navigation.find(item=>item.id===view)?.label ?? 'Lessons'
  const focused=view!=='lessons'
  return <div className={`english-learning-app${focused?' is-focused':''}`} onClick={event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return
    const link=(event.target as Element).closest<HTMLAnchorElement>('a[href]')
    if(!link||link.target||link.hasAttribute('download'))return
    const url=new URL(link.href)
    if(url.origin!==location.origin||url.pathname!==base)return
    event.preventDefault();history.pushState(null,'',url.pathname+url.search);updateRoute(url.search);setEditing(null)
  }}><header className="learning-top">{focused?<a className="learning-return" href={href('lessons')} aria-label="Back to My learning"><Icon name="back"/></a>:<a className="learning-brand" href={href('lessons')} aria-label="English Success · My learning"><img src="/brand/englishsuccess-cap.svg" alt=""/><span>ENGLISH<strong>SUCCESS</strong></span></a>}<h1>{pageTitle}</h1>{focused&&<img className="learning-companion" src="/brand/englishsuccess-cap.svg" alt=""/>}</header><div className="my-learning">
    {!focused&&<nav className="my-learning-nav" aria-label="My learning">{navigation.filter(item => teacher || item.id !== 'content').map(item =>
      <a key={item.id} href={href(item.id,item.id==='homework'&&homeworkTarget&&homeworkTarget!=='general'?homeworkTarget:undefined)} aria-current={view===item.id?'page':undefined}>{navigationArt[item.id]?<img src={`/images/learning-nav/${navigationArt[item.id]}`} alt=""/>:<span className="learning-nav-symbol"><Icon name={item.icon}/></span>}<span>{item.label}</span></a>)}</nav>}
    <div className="my-learning-panel">
      {homeworkTarget && <section className="portal-homework" aria-label="Homework practice" hidden={view!=='homework'}>
        {homeworkLesson&&<div className="portal-homework-bar"><a href={href('document',homeworkLesson.id)}>Lesson notes</a></div>}
        <div className="portal-practice-surface">{homeworkTarget==='general'?<HotelLesson key="general" userId={userId} course={course} active={view==='homework'}/>:homeworkLesson?<AssignedHomework key={homeworkLesson.id} lesson={homeworkLesson} userId={userId} course={course} active={view==='homework'}/>:lessons?<p role="alert">This homework is not available.</p>:<p role="status">Loading homework…</p>}</div>
      </section>}
      {view==='homework'?null:view==='vocabulary' || view==='structures' ? <CurriculumPage key={view} initialView={view} referenceOnly/> : view==='content' ? <HotelContentPage course={{questions:hotelQuestions,skills,skillNames,name:'English Success',curriculum:true,WordHelp:course.WordHelp}}/> : view==='leaderboard' ? <ClassLeaderboard preview={preview}/> : <>
        {teacher && view==='lessons' && <div className="portal-heading"><button disabled={!lessons||creating} onClick={()=>void addLesson()}>{creating?'Creating…':'Add lesson'}</button></div>}
        {teacher && preview && view==='document' && selected?.skills.includes(classOneSkill) && <div className="portal-actions"><a href="/english/race/lesson">Race lesson →</a></div>}
        {error ? <p role="alert">{error} <button onClick={()=>setRevision(n=>n+1)}>Retry</button></p> : !lessons ? <p role="status">Loading lessons…</p> : selected && view==='document' ? <><div className="portal-actions document-links"><a href={href('lessons')}>← Lessons</a>{selected.skills.length>0&&<a href={href('homework',selected.id)}>Homework →</a>}</div><Suspense fallback={<p role="status">Opening notes…</p>}>{selected.skills.includes(classOneSkill)?<><ClassOneMaterial/><details><summary>Class notes</summary><LessonDocument key={`${selected.id}:${userId}`} lessonId={selected.id} userId={userId} teacher={teacher} preview={preview}/></details></>:<LessonDocument key={`${selected.id}:${userId}`} lessonId={selected.id} userId={userId} teacher={teacher} preview={preview}/>}</Suspense></> : view==='document' ? <p role="alert">This lesson is not available.</p> : <ol className="portal-lessons" aria-label="Lessons">{visible.map(lesson => <li key={lesson.id}>
          <a className="portal-lesson-title" href={href('document',lesson.id)}><span className="portal-number" aria-hidden="true">{String(lesson.number).padStart(2,'0')}</span><span><span className="portal-course-label">English Success</span><strong>{lesson.title===`Lesson ${lesson.number}`||lesson.title===`Class ${lesson.number}`?lesson.title:`Lesson ${lesson.number} · ${lesson.title}`}</strong>{lesson.date && <time dateTime={lesson.date}>{new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',day:'numeric',month:'short',year:'numeric'}).format(new Date(`${lesson.date}T12:00:00+07:00`))}</time>}</span></a>
            <div className="portal-actions">{view==='lessons' && <a href={href('document',lesson.id)}>Lesson notes</a>}{lesson.skills.length>0&&<a href={href('homework',lesson.id)}>Homework</a>}{teacher && view==='lessons' && <button aria-label={`Edit ${lesson.title}`} onClick={()=>setEditing(lesson)}>Edit</button>}</div>
          </li>)}</ol>}
        {lessons && !error && !visible.length && <p>{teacher ? 'Add your first lesson.' : 'No lessons published yet.'}</p>}
        {editing && teacher && <LessonEditor key={editing.id} lesson={editing} preview={preview} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);setRevision(n=>n+1)}}/>}
      </>}
    </div>
  </div></div>
}
function AssignedHomework({lesson,userId,course,active}:{lesson:ClassLesson;userId:string;course:ListeningCourse;active:boolean}) {
  const questions = useMemo(()=>lessonQuestions(lesson,hotelQuestions),[lesson])
  const assigned = useMemo<ListeningCourse>(()=>({...course,skills:lesson.skills,skillNames:lesson.skills.map(s=>skillNames[skills.indexOf(s)]??s),nextQuestion:(progress,previous)=>homeworkQuestion(questions,progress,previous)}),[course,lesson,questions])
  if(lesson.skills.includes(classOneSkill))return <HotelLesson userId={userId} course={classOnePractice} active={active}/>
  if(!questions.length) return <p role="alert">The assigned questions are not available. Please contact your teacher.</p>
  return <HotelLesson userId={userId} course={assigned} active={active}/>
}
function LessonEditor({lesson,preview,onClose,onSaved}:{lesson:ClassLesson;preview:boolean;onClose:()=>void;onSaved:()=>void}) {
  const [draft,setDraft]=useState(lesson), [error,setError]=useState(''), [busy,setBusy]=useState(false)
  async function submit(event:React.FormEvent) {
    event.preventDefault();setError('')
    const result=lessonSchema.safeParse(draft)
    if(!result.success){setError(result.error.issues[0].message);return}
    setBusy(true)
    try {await saveLesson(result.data,preview);onSaved()} catch(cause){setError(cause instanceof Error?cause.message:'Could not save.')} finally{setBusy(false)}
  }
  return <form className="portal-editor" aria-label="Edit lesson" onSubmit={submit}>
    <label>Lesson number<input required type="number" min="1" max="999" value={draft.number} onChange={e=>setDraft({...draft,number:Number(e.target.value)})}/></label>
    <label>Title<input required maxLength={160} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
    <label>Date<input type="date" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></label>
    <fieldset><legend>Homework content</legend><label><input type="checkbox" checked={draft.skills.includes(classOneSkill)} onChange={e=>setDraft({...draft,skills:e.target.checked?[classOneSkill]:[]})}/>Class 1 · Everyday questions</label>{[...new Set(skillNames)].map(name=>{const group=skills.filter((_,index)=>skillNames[index]===name);return <label key={name}><input type="checkbox" checked={group.every(s=>draft.skills.includes(s))} onChange={e=>setDraft({...draft,skills:e.target.checked?[...new Set([...draft.skills.filter(s=>s!==classOneSkill),...group])]:draft.skills.filter(s=>!group.includes(s))})}/>{name}</label>})}</fieldset>
    <label><input type="checkbox" checked={draft.published} onChange={e=>setDraft({...draft,published:e.target.checked})}/>Published</label>
    {error && <p role="alert">{error}</p>}<div className="portal-actions"><button disabled={busy} type="submit">{busy?'Saving…':'Save'}</button><button disabled={busy} type="button" onClick={onClose}>Cancel</button></div>
  </form>
}
type Rank = {id:string;name:string;avatarUrl:string|null;points:number;rank:number}
function ClassLeaderboard({preview}:{preview:boolean}) {
  const [period,setPeriod]=useState('week'), [rows,setRows]=useState<Rank[]|null>(null), [error,setError]=useState(''),[retry,setRetry]=useState(0)
  useEffect(()=>{
    if(preview)return
    let active=true
    void englishScoring.join().then(async()=>{
      const {data,error}=await supabase.rpc('english_learning_leaderboard',{p_period:period}).abortSignal(AbortSignal.timeout(12000))
      if(error)throw error
      if(active)setRows(data??[])
    }).catch(()=>{if(active)setError('Could not load scores.')})
    return ()=>{active=false}
  },[period,preview,retry])
  return <section><h1>Leaderboard</h1><div className="portal-periods">{[['today','Today'],['week','This week'],['month','This month']].map(([value,label])=><button key={value} aria-pressed={value===period} onClick={()=>{setRows(null);setError('');setPeriod(value)}}>{label}</button>)}</div>
    {preview?<p>Sign in on the live site to see real scores.</p>:error?<p role="alert">{error}<button onClick={()=>{setError('');setRetry(n=>n+1)}}>Retry</button></p>:rows===null?<p role="status">Loading…</p>:<table className="portal-scores"><thead><tr><th>#</th><th>Name</th><th>Points</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{row.rank}</td><td>{row.avatarUrl && <img src={row.avatarUrl} alt="" referrerPolicy="no-referrer"/>}{row.name}</td><td>{row.points}</td></tr>)}</tbody></table>}
    {rows?.length===0&&<p>No scores yet.</p>}
  </section>
}

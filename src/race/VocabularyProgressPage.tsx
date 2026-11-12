import {adjectivesForNoun} from '../learning/sentenceRules/adjectiveSemantics'
import {useEffect,useState} from 'react'
import type {User} from '@supabase/supabase-js'
import {supabase} from '../lib/supabase'
import {useStudentVocabulary} from './studentVocabulary'
import {recogniseHomeworkAccount} from '../auth/homeworkLine'
import {useWordProgress} from '../learning/wordProgress/useWordProgress'
import {wordHierarchies,hierarchyState,type HierarchyType} from './wordHierarchy'
import {loadEvidence} from './generatedPracticeProgress'
import {vocabularyLearning} from './vocabularyProgress'
import {learningStates,type WordLearning} from '../learning/wordProgress/learningLifecycle'
import VocabularyPicture from '../learning/VocabularyPicture'
import {ActionIcon} from '../learning/sentenceMatrix/ActionVocabularyIcon'
import DescriptionPicture from '../learning/DescriptionPicture'
import PronounIcon from '../learning/sentenceMatrix/PronounIcon'
import {verbGroupFor,type VerbGroup} from '../learning/sentenceRules/verbGroups'
import {nounVerbMatches} from './nounVerbMatches'
import {nounGroupFor,type NounGroup} from './nounGroups'
import DeterminerIcon from '../learning/sentenceMatrix/DeterminerIcon'
const localDiagnostic=import.meta.env.DEV&&['localhost','127.0.0.1','[::1]'].includes(location.hostname)
const lists=[
 {type:'noun',title:'Nouns',icon:VocabularyPicture},
 {type:'verb',title:'Verbs',icon:ActionIcon},
 {type:'adjective',title:'Adjectives',icon:DescriptionPicture},
 {type:'pronoun',title:'Pronouns',icon:PronounIcon},
 {type:'determiner',title:'Determiners',icon:DeterminerIcon},
] as const
export default function VocabularyReview(){
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{
  if(localDiagnostic)return
  let active=true,authChanged=false
  void supabase.auth.getUser().then(({data,error})=>{if(active&&!authChanged){setUser(data.user);setReady(true);if(error&&error.name!=='AuthSessionMissingError')setError('Could not load your account. Please try again.')}}).catch(()=>{if(active&&!authChanged){setReady(true);setError('Could not load your account. Please try again.')}})
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(active){authChanged=true;setUser(session?.user??null);setReady(true);setError('')}})
  return()=>{active=false;subscription.unsubscribe()}
 },[])
 async function signIn(){setBusy(true);setError('');try{const id=await recogniseHomeworkAccount();if(id){const {data,error}=await supabase.auth.getUser();if(error)throw error;setUser(data.user)}}catch{setError('Could not sign in. Please try again.')}finally{setBusy(false)}}
 if(localDiagnostic)return <AccountVocabulary userId="diagnostic" diagnostic/>
 if(ready&&user)return <AccountVocabulary key={user.id} userId={user.id}/>
 return <><header className="vocab-account"><a href="/english/practice" aria-label="Back to testing">←</a><div><h1>Vocabulary</h1>{ready&&<p>Sign in to see student progress.</p>}</div>{ready&&<button onClick={()=>void signIn()} disabled={busy}>{busy?'…':'Sign in with LINE'}</button>}</header>{error&&<p role="alert">{error}</p>}{!ready?<p role="status">Loading account…</p>:<VocabularyLists/>}</>
}
function AccountVocabulary({userId,diagnostic=false}:{userId:string;diagnostic?:boolean}){
 const [selected,setSelected]=useState<string|null>(null)
 const [vocabularyType,setVocabularyType]=useState<HierarchyType>('noun')
 const {snapshot,error,retry}=useStudentVocabulary(userId,selected,diagnostic)
 const learner=selected??snapshot?.selected,student=snapshot?.students.find(s=>s.id===learner)
 const current=snapshot&&snapshot.selected===learner?snapshot:null
 const learning=current?learningStates(current.rows,current.selected===userId?loadEvidence(userId):[]):undefined
 const state=learning?hierarchyState(new Set([...learning].filter(([,s])=>s.provenAt).map(([id])=>id))):undefined
 return <><header className="vocab-account">{!diagnostic&&<a href="/english/practice" aria-label="Back to testing">←</a>}<div><h1>{student?`${student.name}’s words`:'Word progress'}</h1></div>{snapshot&&<label className="vocab-student">Student<select aria-label="Student" value={learner} onChange={event=>setSelected(event.target.value)}>{snapshot.students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}</header>{error&&<button role="alert" onClick={retry}>Retry loading student progress</button>}{current?<VocabularyLists userId={current.selected} rows={current.rows} state={state} learning={learning} activeType={vocabularyType} onType={setVocabularyType}/>:!error?<p role="status">Loading progress…</p>:null}</>
}
export function VocabularyLists({userId,rows=[],state,learning,activeType,onType}:{userId?:string;rows?:ReturnType<typeof useWordProgress>['rows'];state?:ReturnType<typeof hierarchyState>;learning?:ReadonlyMap<string,WordLearning>;activeType?:HierarchyType;onType?:(type:HierarchyType)=>void}){
 const [internalType,setInternalType]=useState<HierarchyType>('noun')
 const [nounGroup,setNounGroup]=useState<NounGroup>('subjects')
 const [verbGroup,setVerbGroup]=useState<VerbGroup>('transitive')
 const selected=activeType??internalType,changeType=onType??setInternalType,progress=learning??learningStates(rows)
 return <><nav className="vocab-tabs" role="tablist" aria-label="Vocabulary types">{lists.map((list,index)=><button type="button" key={list.type} id={`vocab-tab-${list.type}`} role="tab" aria-selected={selected===list.type} aria-controls={`vocab-panel-${list.type}`} tabIndex={selected===list.type?0:-1} onClick={()=>changeType(list.type)} onKeyDown={event=>{
  const next=event.key==='ArrowRight'?(index+1)%lists.length:event.key==='ArrowLeft'?(index+lists.length-1)%lists.length:event.key==='Home'?0:event.key==='End'?lists.length-1:null
  if(next!==null){event.preventDefault();changeType(lists[next].type);document.getElementById(`vocab-tab-${lists[next].type}`)?.focus()}
 }}>{list.title}</button>)}</nav><div className="vocab-lists">{lists.filter(list=>list.type===selected).map(list=>{
  const parentTrack=state?.[list.type],groupTrack=list.type==='noun'?parentTrack?.nounGroups?.[nounGroup]:list.type==='verb'?parentTrack?.verbGroups?.[verbGroup]:undefined,track=parentTrack&&groupTrack?{...parentTrack,...groupTrack}:parentTrack,words:readonly string[]=wordHierarchies[list.type].filter(word=>list.type==='noun'?nounGroupFor(word)===nounGroup:list.type==='verb'?verbGroupFor(word)===verbGroup:true),verified=words.filter(word=>vocabularyLearning(list.type,word,progress).provenAt).length
  return <section key={list.type} role="tabpanel" id={`vocab-panel-${list.type}`} aria-labelledby={`vocab-tab-${list.type}`}><h2>{list.title}{track&&<small>{words.length?Math.round(verified/words.length*100):0}% learnt</small>}</h2>{list.type==='noun'&&<div className="vocab-subgroups" role="group" aria-label="Noun groups">{(['subjects','objects'] as const).map(group=><button key={group} type="button" aria-pressed={nounGroup===group} onClick={()=>setNounGroup(group)}>{group==='subjects'?'Subjects':'Objects'}</button>)}</div>}{list.type==='verb'&&<div className="vocab-subgroups" role="group" aria-label="Verb groups">{(['transitive','intransitive'] as const).map(group=><button key={group} type="button" aria-pressed={verbGroup===group} onClick={()=>setVerbGroup(group)}>{group==='transitive'?'Transitive':'Intransitive'}</button>)}</div>}{track&&<div className="vocab-pool"><p><strong>Current:</strong> {track.current.filter(word=>words.includes(word)).length?track.current.filter(word=>words.includes(word)).join(', '):verified===words.length?'All learnt':'—'}</p>{track.next&&words.includes(track.next)&&<p className="vocab-queued">Next: {track.next}</p>}</div>}<ol>{words.map(word=>{
   const score=vocabularyLearning(list.type,word,progress),status=track?(score.provenAt?'learnt':track.current.includes(word)?'current':track.next===word?'next':'later'):null
   return <li key={word} data-word={word} data-status={status??undefined}><span className="vocab-review-row">{list.icon&&<span className="vocab-review-icon" aria-hidden="true"><list.icon word={word}/></span>}<span className="vocab-word"><span>{word}</span>{userId&&<><small>{score.provenAt?`${score.due?'Review due':'Review'} ${score.reviewDueAt?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'Asia/Bangkok'}).format(new Date(score.reviewDueAt)):''}`:score.stage==='confirming'?`100% faded · Confirming ${Math.round(score.confirmations/3*100)}%`:`${score.stage==='relearning'?'Relearning':'Fading'} ${score.fadePercent}%`}</small><progress max={100} value={score.fadePercent} aria-label={`${word}: ${score.fadePercent}% faded`}/></>}</span>{status&&<span className={`vocab-status vocab-status-${score.due?'review':status}`}>{score.provenAt?(score.due?'Review due':'✓ Learnt'):status==='current'?'Current':status==='next'?'Next':'Later'}</span>}</span>{list.type==='noun'&&<><NounVerbs word={word}/><NounDescriptions word={word}/></>}</li>
  })}</ol></section>
 })}</div></>
}

function NounVerbs({word}:{word:string}){
 const matches=nounVerbMatches(word)
 return <details className="vocab-noun-verbs"><summary>Verbs <span>{matches.length}</span></summary>{matches.length?<div className="vocab-verb-matches">{(['transitive','intransitive'] as const).map(group=>{
  const verbs=matches.filter(match=>match.group===group)
  return verbs.length?<div key={group}><small>{group==='transitive'?'Transitive':'Intransitive'}</small><div>{verbs.map(verb=><span className="vocab-verb-match" key={verb.label}><ActionIcon word={verb.word}/>{verb.label}</span>)}</div></div>:null
 })}</div>:<p>No compatible verbs</p>}</details>
}

function NounDescriptions({word}:{word:string}){
 const matches=adjectivesForNoun(word)
 return <details className="vocab-noun-verbs"><summary>Adjectives <span>{matches.length}</span></summary><div className="vocab-verb-matches"><div><div>{matches.map(match=><span className="vocab-verb-match" key={match.word}><DescriptionPicture word={match.word}/>{match.word}</span>)}</div></div></div></details>
}

import { grammarSkills, meaningPairs, formItems } from './grammarContent'
import { recordAnswer as legacyRecordAnswer } from './legacyCourse'
import type { HotelQuestion as LegacyQuestion, Progress as LegacyProgress } from './legacyCourse'
export type { Segment } from './legacyCourse'

export type GrammarTarget = {
  kind: 'meaning' | 'form'; context: string; phase: 'practice' | 'transfer'
  targets: string[]; explanation: string; contrast: string; thai?: string
  prompt?: string; promptAudioUrl?: string
  domain?: 'Home'|'Family'|'Food'|'Work'|'Study'|'Shopping'|'Travel'|'Leisure'
  sequenceTier?: number
}
export type HotelQuestion = LegacyQuestion & { grammar?: GrammarTarget }
export const skills: string[] = grammarSkills.map(([id]) => id)
export const skillNames: string[] = grammarSkills.map(([,name]) => name)
const tokens = (s: string): string[] => s.toLowerCase().match(/[a-z]+(?:'[a-z]+)*/g) ?? []
const items: HotelQuestion[] = []
for (const skill of skills) {
  const pairs = meaningPairs.filter(p => p.skill === skill)
  pairs.forEach((pair, context) => pair.english.forEach((english, side) => {
    const id = `hotel-g2-${skill}-${context + 1}-${side + 1}`
    const other = tokens(pair.english[1 - side])
    // Credit changed grammatical forms, not stable incidental nouns. Role
    // contrasts also credit explicitly authored role words when both recur.
    const roleWords = ['roles','passive'].includes(skill) ? pair.target[side].split(' ') : []
    const targets = tokens(english).filter(w => !other.includes(w) || roleWords.includes(w))
    items.push({ id, english, skill, correct: side as 0 | 1, audioUrl: `/audio/hotel/${id}.wav`,
      answers: pair.thai.map(text => [{text,skill}]) as HotelQuestion['answers'],
      grammar: {kind:'meaning',context:`${skill}-${context}`,phase:context >= pairs.length - 2 ? 'transfer' : 'practice', targets,
        contrast:pair.english[1-side],explanation:pair.explanation},
    })
  }))
  const forms = formItems.filter(f => f.skill === skill)
  forms.forEach((form, context) => {
    const id = `hotel-g2-${skill}-${context + 1}`
    const correct = (context % 2) as 0 | 1
    const choices = correct ? [form.wrong,form.right] : [form.right,form.wrong]
    items.push({id,english:form.prompt.replace('_____',form.right),skill,correct,audioUrl:`/audio/hotel/${id}.wav`,
      answers: choices.map(text => [{text,skill}]) as HotelQuestion['answers'],
      grammar:{kind:'form',context:`${skill}-${context}`,phase:context >= forms.length - 2 ? 'transfer' : 'practice',
        targets:tokens(form.right).length > 1 ? tokens(form.right).filter(w => !tokens(form.wrong).includes(w)) : tokens(form.right),explanation:form.explanation,contrast:form.prompt.replace('_____',form.wrong),
        thai:form.thai,prompt:form.prompt,promptAudioUrl:`/audio/hotel/${id}-prompt.wav`},
    })
  })
}
export const hotelQuestions: readonly HotelQuestion[] = items
// Authoring tools must not depend on the mutable, database-installed ordering.
export const bundledHotelQuestions: readonly HotelQuestion[] = Object.freeze(items.slice())
const indexGroups=(questions:readonly HotelQuestion[])=>{
  const groups=new Map<string,HotelQuestion[]>()
  for(const q of questions){const rows=groups.get(q.skill)??[];rows.push(q);groups.set(q.skill,rows)}
  return groups
}
let questionGroups=indexGroups(items)
// Called by the language-database gate before a lesson mounts. Stable array
// identities keep the shared practice/content consumers on the same catalogue.
let prerequisites:Record<string,string[]>={}
let learningCourse: 'english' | 'hotel' | undefined
export function installHotelCatalogue(questions: readonly HotelQuestion[], order: {id:string;name:string;prerequisites?:string[]}[], course?: 'english' | 'hotel') {
  const ordered=order.flatMap(s=>questions.filter(q=>q.skill===s.id))
  if(!ordered.length || ordered.length!==questions.length) throw new Error('Invalid Hotel catalogue')
  items.splice(0,items.length,...ordered)
  questionGroups=indexGroups(ordered)
  skills.splice(0,skills.length,...order.map(s=>s.id))
  skillNames.splice(0,skillNames.length,...order.map(s=>s.name))
  prerequisites=Object.fromEntries(order.map(s=>[s.id,s.prerequisites??[]]))
  learningCourse=course
}
export const legacyProgressKey = (id: string) => `hotel:grammar:v2:${id}`
export const legacyWordMemoryKey = (id: string) => `hotel:grammar-words:v2:${id}`
export const progressKey = (id: string) => learningCourse === 'english' ? `english:grammar:v1:${id}` : learningCourse === 'hotel' ? `hotel:grammar:v3:${id}` : legacyProgressKey(id)
export const grammarWordMemoryKey = (id: string) => learningCourse === 'english' ? `english:grammar-words:v1:${id}` : learningCourse === 'hotel' ? `hotel:grammar-words:v3:${id}` : legacyWordMemoryKey(id)
export const RETENTION_MS = 24 * 60 * 60 * 1000
export type Evidence = { attempts:number; streak:number; firstCorrect:number; lastCorrect:number; retained:boolean; audioStreak?:number; firstAudioCorrect?:number; audioRetained?:boolean }
export type Progress = Record<string, LegacyProgress[string] & { items?:Record<string,Evidence>; recent?:boolean[] }>
const group = (skill:string) => questionGroups.get(skill)??[]
const successful = (p:Progress,q:HotelQuestion) => {
  const e=p[q.skill]?.items?.[q.id]
  return (q.grammar?.kind==='meaning' ? e?.audioStreak ?? 0 : e?.streak ?? 0) >= 2
}
// Supported encounters are preparation, not proof of listening comprehension.
export function requiresAudioCheck(progress:Progress,question:HotelQuestion) {
  const e=progress[question.skill]?.items?.[question.id]
  return question.grammar?.kind==='meaning' && (question.grammar.phase==='transfer' || (e?.streak??0)>=2 || (e?.audioStreak??0)>0)
}
export function practiceReady(progress:Progress,skill:string) {
  return group(skill).filter(q=>q.grammar?.phase==='practice').every(q=>successful(progress,q))
}
export function isSkillReady(progress:Progress,skill:string) {
  const recent=progress[skill]?.recent ?? []
  return group(skill).length>0 && group(skill).every(q=>successful(progress,q)) && recent.length===12 && recent.filter(Boolean).length>=10
}
export function isSkillComplete(progress:Progress,skill:string) {
  if (!isSkillReady(progress,skill)) return false
  const retained=group(skill).filter(q=>q.grammar?.kind==='meaning' ? progress[skill]?.items?.[q.id]?.audioRetained : progress[skill]?.items?.[q.id]?.retained)
  return new Set(retained.map(q=>q.grammar!.context)).size>=4 && new Set(retained.filter(q=>q.grammar?.phase==='transfer').map(q=>q.grammar!.context)).size>=2
}
export function recordAnswer(progress:Progress,question:HotelQuestion,correct:boolean,assisted:boolean,now=Date.now(),audioOnly=false):Progress {
  // Shared Padel lessons retain their v1 behaviour; never change their contract.
  if (!question.grammar) return legacyRecordAnswer(progress,question,correct,assisted)
  const prior=progress[question.skill] ?? {seen:[],correct:0,attempts:0}
  const old=prior.items?.[question.id] ?? {attempts:0,streak:0,firstCorrect:0,lastCorrect:0,retained:false}
  const earned=correct&&!assisted
  const entry:Evidence={attempts:old.attempts+1,streak:earned?old.streak+1:0,
    firstCorrect:earned?(old.firstCorrect||now):0,lastCorrect:earned?now:0,
    retained:earned&&(old.retained||(old.streak>0&&now-old.firstCorrect>=RETENTION_MS))}
  if(question.grammar.kind==='meaning') {
    const listening=earned&&audioOnly
    entry.audioStreak=listening?(old.audioStreak??0)+1:earned?(old.audioStreak??0):0
    entry.firstAudioCorrect=listening?(old.firstAudioCorrect||now):earned?(old.firstAudioCorrect??0):0
    entry.audioRetained=earned&&!!(old.audioRetained || (listening&&(old.audioStreak??0)>0&&now-(old.firstAudioCorrect??now)>=RETENTION_MS))
  }
  const all={...prior.items,[question.id]:entry}
  return {...progress,[question.skill]:{attempts:prior.attempts+1,correct:prior.correct+Number(correct),items:all,
    recent:[...(prior.recent??[]),earned].slice(-12),seen:group(question.skill).filter(q=>(q.grammar?.kind==='meaning'?all[q.id]?.audioStreak??0:all[q.id]?.streak??0)>=2).map(q=>q.id)}}
}
export function nextQuestion(progress:Progress,previous?:string,round=0,random=Math.random,now=Date.now()):HotelQuestion {
  const focus=skills.filter(s=>!isSkillReady(progress,s)&&(prerequisites[s]??[]).every(p=>isSkillReady(progress,p))).slice(0,2)
  const review=skills.filter(s=>isSkillReady(progress,s))
  const focusRound=review.length?round-Math.floor((round+1)/4):round
  const reviewing=(!focus.length || round%4===3)&&review.length>0
  const skill=reviewing?review[Math.floor(round/4)%review.length]:focus[focusRound%focus.length]
  const pool=group(skill).filter(q=>q.id!==previous && (q.grammar?.phase==='practice'||practiceReady(progress,skill)))
  const due=pool.filter(q=>{const e=progress[skill]?.items?.[q.id];return e&&(q.grammar?.kind==='meaning' ? !e.audioRetained&&!!e.firstAudioCorrect&&now-e.firstAudioCorrect>=RETENTION_MS : !e.retained&&!!e.firstCorrect&&now-e.firstCorrect>=RETENTION_MS)})
  const unfinished=pool.filter(q=>!successful(progress,q))
  let available=reviewing&&due.length?due:unfinished.length?unfinished:pool
  // English's authored lexical tier comes before sentence length. A short
  // unfamiliar verb must not displace an unfinished familiar-action exercise.
  if (learningCourse==='english' && !reviewing && unfinished.length) {
    const first=Math.min(...available.map(q=>q.grammar?.sequenceTier??1))
    available=available.filter(q=>(q.grammar?.sequenceTier??1)===first)
  }
  // Work from short chunks to longer clauses within a focus. Review remains
  // mixed; length is a sequencing aid, not a claimed proficiency level.
  if(!reviewing && unfinished.length) {
    const tier=(q:HotelQuestion)=>Math.floor((tokens(q.english).length-1)/5)
    const firstTier=Math.min(...available.map(tier))
    available=available.filter(q=>tier(q)===firstTier)
  }
  // Prefer the least practised evidence, rather than cycling one answer pair.
  const min=Math.min(...available.map(q=>progress[skill]?.items?.[q.id]?.attempts??0))
  available=available.filter(q=>(progress[skill]?.items?.[q.id]?.attempts??0)===min)
  return available[Math.min(available.length-1,Math.max(0,Math.floor(random()*available.length)))]
}
export function loadProgress(userId:string):Progress {
  try {
    // Read the old combined evidence only until this course has its own save.
    // Never overwrite that legacy record: the other course still needs it.
    const raw:unknown=JSON.parse(localStorage.getItem(progressKey(userId))??localStorage.getItem(legacyProgressKey(userId))??'{}')
    if(!raw||typeof raw!=='object'||Array.isArray(raw)) return {}
    const result:Progress={}
    for(const skill of skills){
      const row=(raw as Progress)[skill]
      if(!row||!Number.isSafeInteger(row.attempts)||!Number.isSafeInteger(row.correct)||row.correct<0||row.attempts<row.correct) continue
      const valid:Record<string,Evidence>={}
      for(const q of group(skill)){
        const e=row.items?.[q.id]
        if(e&&[e.attempts,e.streak,e.firstCorrect,e.lastCorrect].every(n=>Number.isSafeInteger(n)&&n>=0)&&e.streak<=e.attempts&&e.lastCorrect>=e.firstCorrect&&typeof e.retained==='boolean') {
          valid[q.id]={...e,retained:e.retained&&e.streak>=2&&e.lastCorrect-e.firstCorrect>=RETENTION_MS}
          if(q.grammar?.kind==='meaning') {
            const audioValid=Number.isSafeInteger(e.audioStreak)&&e.audioStreak!>=0&&e.audioStreak!<=e.streak&&Number.isSafeInteger(e.firstAudioCorrect)&&e.firstAudioCorrect!>=0&&e.firstAudioCorrect!<=e.lastCorrect
            valid[q.id].audioStreak=audioValid?e.audioStreak:0
            valid[q.id].firstAudioCorrect=audioValid?e.firstAudioCorrect:0
            valid[q.id].audioRetained=audioValid&&e.audioRetained===true&&e.audioStreak!>=2&&e.lastCorrect-e.firstAudioCorrect!>=RETENTION_MS
          }
        }
      }
      result[skill]={attempts:row.attempts,correct:row.correct,items:valid,recent:Array.isArray(row.recent)?row.recent.filter(v=>typeof v==='boolean').slice(-12):[],seen:group(skill).filter(q=>(q.grammar?.kind==='meaning'?valid[q.id]?.audioStreak??0:valid[q.id]?.streak??0)>=2).map(q=>q.id)}
    }
    return result
  }catch{return {}}
}
export function supportOpacity(progress:Progress,skill:string){return isSkillComplete(progress,skill)?0.25:1}

import {tonightMeaningQuestions} from './tonightQuestions'
import {lessonTwoReviewQuestions} from './lessonTwoQuestions'
export type PracticeModule={id:string;title:string;questionIds:string[];number:number;total:number}
/** Small complete-sentence packs: four contexts, then a listening pass. */
export function practiceModules(lesson:number):PracticeModule[]{
 const source=lesson===2?[...tonightMeaningQuestions,...lessonTwoReviewQuestions.filter(q=>q.id.startsWith('l2-translation-')&&q.audioUrl?.startsWith('/audio/race-lesson-two/'))]:[...tonightMeaningQuestions]
 const groups=new Map<string,typeof source>()
 for(const q of source){
  const match=q.english.match(/^Where (is|are) (the|my|your) /)
  if(!match)throw new Error(`No module pattern for ${q.id}`)
  const title=`Where ${match[1]} ${match[2]} …?`
  groups.set(title,[...(groups.get(title)??[]),q])
 }
 const signature=(questions:typeof source)=>{let hash=2166136261;for(const char of questions.map(q=>q.id+'|'+q.english+'|'+q.answers[q.correct][0].text).join('~'))hash=Math.imul(hash^char.charCodeAt(0),16777619);return (hash>>>0).toString(36)}
 const packs=[...groups.entries()].flatMap(([title,questions])=>Array.from({length:Math.ceil(questions.length/4)},(_,index)=>({id:`l${lesson}-${title.replace(/[^a-z]+/gi,'-').toLowerCase()}-${index+1}-${signature(questions.slice(index*4,index*4+4))}`,title,questionIds:questions.slice(index*4,index*4+4).map(q=>q.id)})))
 return packs.map((pack,index)=>({...pack,number:index+1,total:packs.length}))
}
export const modulePassed=(score:number,total:number)=>total>0&&score>=Math.ceil(total*.75)

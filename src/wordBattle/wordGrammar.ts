import type { ClassroomWord } from '../learning/sentenceMatrix/model'
import { descriptions } from '../learning/everydayVocabulary'
import { universityVocabulary } from '../learning/universityVocabulary'
import { actionVocabulary } from '../learning/sentenceRules/actionDialogue'
import { subjectPronouns, subjectVerb } from '../learning/sentenceMatrix/subjectEngine'

// The game reads the same noun forms and action entries as Success University.
export const nouns:readonly ClassroomWord[] = [...universityVocabulary, ...[['dog','dogs'],['cat','cats'],['fish','fishes']].flatMap(([singular,plural])=>[{word:singular,singular,plural,thai:'',number:'singular' as const},{word:plural,singular,plural,thai:'',number:'plural' as const}])]
export const actions = actionVocabulary
export const adjectives = [...new Set(descriptions.map(item=>item.word))]
export const functionWords = ['the','a','my','your','his','her','our','their','this','that','these','those','is','are','am','and','to','at','in','on','with','where','what',...subjectPronouns.map(s=>s.word)]
export const words = [...new Set([...nouns.map(n=>n.word),...actions.map(a=>a.word),...adjectives,...functionWords,'quickly','slowly'])]
export type Word = string
const nounMap = new Map(nouns.map(noun=>[noun.word.toLowerCase(),noun]))
const actionMap = new Map(actions.map(action=>[action.word.toLowerCase(),action]))
const adjectiveSet = new Set<string>(adjectives)
const owners = new Set(['the','a','my','your','his','her','our','their','this','that','these','those'])
type Phrase = {end:number;be:'am'|'is'|'are'}
export function evaluate(input:string[]) {
 const w=input.map(word=>word.toLowerCase())
 function nominal(start:number,subject=false):Phrase[] {
  const out:Phrase[]=[]
  const pronoun=subjectPronouns.find(p=>p.word.toLowerCase()===w[start])
  if(subject&&pronoun)out.push({end:start+1,be:subjectVerb(pronoun)})
  if(subject&&['this','that','these','those'].includes(w[start]))out.push({end:start+1,be:['these','those'].includes(w[start])?'are':'is'})
  let i=start;const det=owners.has(w[i])?w[i++]:undefined
  while(adjectiveSet.has(w[i]))i++
  const noun=nounMap.get(w[i]);if(!noun)return out
  const plural=noun.number==='plural'||!!noun.pairOnly
  const mass=noun.meaning?.countability==='mass'
  if(!det&&!plural&&!mass)return out
  if(det==='a'&&(plural||mass))return out
  if(['this','that'].includes(det??'')&&plural)return out
  if(['these','those'].includes(det??'')&&!plural)return out
  out.push({end:i+1,be:plural?'are':'is'})
  return out
 }
 function subjects(start:number):Phrase[]{
  const out=nominal(start,true)
  for(const p of [...out])if(w[p.end]==='and')for(const q of nominal(p.end+1,true))out.push({end:q.end,be:'are'})
  return out
 }
 function tails(start:number):number[]{
  let i=start
  if(['quickly','slowly'].includes(w[i]))i++
  const ends=[i]
  if(['to','at','in','on','with'].includes(w[i]))for(const p of nominal(i+1))ends.push(...tails(p.end))
  return ends
 }
 function predicates(start:number):number[]{
  const action=actionMap.get(w[start])
  const ends:number[]=[]
  if(action){
   const i=start+1
   const bare=action.complement==='none'||['eating','drinking','reading','cooking','drawing','painting','teaching','watching'].includes(action.word)
   if(bare)ends.push(...tails(i))
   if(action.complement==='object'||action.word.includes(' ')&&action.preposition)for(const p of nominal(i))ends.push(...tails(p.end))
   const prep=action.preposition?.english??(action.complement==='destination'?'to':undefined)
   if(prep&&w[i]===prep)for(const p of nominal(i+1))ends.push(...tails(p.end))
   // Movement and location connections use separate word cards.
   if(action.destination&&w[i]==='to')for(const p of nominal(i+1))ends.push(...tails(p.end))
  }
  if(adjectiveSet.has(w[start]))ends.push(...tails(start+1))
  for(const p of nominal(start))ends.push(...tails(p.end))
  if(['at','in','on','with'].includes(w[start]))for(const p of nominal(start+1))ends.push(...tails(p.end))
  return ends
 }
 function clauses(start:number):number[]{
  const ends:number[]=[]
  for(const subject of subjects(start))if(w[subject.end]===subject.be)ends.push(...predicates(subject.end+1))
  // Where/what questions and auxiliary-first questions use the same agreement lookup.
  const beIndex=['where','what'].includes(w[start])?start+1:start
  if(['am','is','are'].includes(w[beIndex]))for(const subject of subjects(beIndex+1))if(w[beIndex]===subject.be){
   if(beIndex>start)ends.push(subject.end)
   ends.push(...predicates(subject.end))
  }
  return ends
 }
 function full(start:number):boolean{
  for(const end of clauses(start))if(end===w.length||w[end]==='and'&&full(end+1))return true
  return false
 }
 const sentence=w.length>=2&&full(0)
 const phrase=w.length>=2&&(nominal(0).some(p=>p.end===w.length)||w.includes('and')&&subjects(0).some(p=>p.end===w.length))
 const actionPhrase=w.length>=2&&actionMap.has(w[0])&&predicates(0).includes(w.length)
 const valid=sentence||phrase||actionPhrase
 return {valid,score:valid?w.length**2+(sentence?6:0):0,reason:sentence?'Complete sentence':valid?'Phrase':'Unconnected words'}
}

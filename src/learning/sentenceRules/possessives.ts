import type {NounPhrase} from '../sentenceMatrix/nounPhrase'
import {nounPhraseUnits} from '../sentenceMatrix/nounPhrase'
import {everydayPeople} from '../everydayVocabulary'
export type PossessiveWord = `${string}’s` | `${string}s’`
export type Possessor = {kind:'name';word:string;thai:string} | {kind:'phrase';phrase:NounPhrase}
export type PossessiveDeterminer = {english:PossessiveWord;thai:string;possessor:Possessor}
/** The possessor is a whole phrase; the final head noun still controls sentence agreement. */
export function possessiveDeterminer(possessor:Possessor):PossessiveDeterminer {
 const english=possessor.kind==='name'?possessor.word:nounPhraseUnits(possessor.phrase).map(unit=>unit.english).join(' ')
 if(!english.trim()||/[.!?]/.test(english)||possessor.kind==='phrase'&&possessor.phrase.preposition)throw new Error('A possessor must be a name or noun phrase, without a sentence or preposition.')
 const plural=possessor.kind==='phrase'&&possessor.phrase.number==='plural'
 const suffix=plural&&/s$/i.test(english)?'’':'’s'
 const meaning=possessor.kind==='name'?possessor.thai:possessor.phrase.nounThai+(possessor.phrase.description?.thai??'')+(possessor.phrase.determiner?.thai.startsWith('ของ')?possessor.phrase.determiner.thai:'')
 return {english:`${english}${suffix}` as PossessiveWord,thai:`ของ${meaning}`,possessor}
}
const definiteNounPhrase=(word:string,thai:string,number:'singular'|'plural'='singular'):NounPhrase=>({noun:word,nounThai:thai,number,determiner:{english:'the',thai:'ที่กำลังพูดถึง'}})
const doctor:NounPhrase={noun:'doctor',nounThai:'หมอ',determiner:{english:'my',thai:'ของฉัน'}}
const doctorsWife:NounPhrase={noun:'wife',nounThai:'ภรรยา',determiner:possessiveDeterminer({kind:'phrase',phrase:doctor})}
/** Reviewed selectable examples; required words keep phrases outside the supplied vocabulary out of its picker. */
export const possessiveChoices=[
 {value:possessiveDeterminer({kind:'name',word:'Bia',thai:'เบีย'}),requires:[] as string[]},
 ...everydayPeople.flatMap(person=>[
  {value:possessiveDeterminer({kind:'phrase',phrase:definiteNounPhrase(person.singular,person.thai)}),requires:[person.singular]},
  {value:possessiveDeterminer({kind:'phrase',phrase:definiteNounPhrase(person.plural,person.thai,'plural')}),requires:[person.plural]},
 ]),
 {value:possessiveDeterminer({kind:'phrase',phrase:doctor}),requires:['doctor']},
 {value:possessiveDeterminer({kind:'phrase',phrase:doctorsWife}),requires:['doctor','wife']},
]
export const possessiveFor=(word:string)=>possessiveChoices.find(choice=>choice.value.english===word)?.value

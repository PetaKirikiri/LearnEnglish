import { subjectPronouns, subjectVerb, type SubjectWord } from './subjectEngine'
import type { ClassroomWord } from './model'
import { nounsForSentence } from '../sentenceRules/choices'
import { assertSentence } from '../sentenceRules/blueprints'

export const people = subjectPronouns.map(item=>({...item,verb:subjectVerb(item)}))
export type Person = typeof people[number]['word']
export type PeoplePattern = 'question' | 'answer'
export const personDetail = (person:Person) => people.find(item=>item.word===person)!
// The question is spoken by one partner; the answer is spoken by the other.
export const replyPerson = (person:Person):Person => person==='you'?'I':person==='I'?'you':person
// These are destinations for "at the ...", not every noun in the collection.
// "in the bedroom" is more natural and belongs to a later preposition contrast.
export const locationWords = (words:readonly ClassroomWord[]) => nounsForSentence({blueprint:'person-at-place',subject:subjectPronouns[0],verb:'am',determiner:'the'},words).filter(noun=>noun.number!=='plural'&&!noun.pairOnly)
export function peopleSentence(pattern:PeoplePattern,person:Person,place:ClassroomWord) {
  const detail=personDetail(person)
 assertSentence({blueprint:pattern==='question'?'where-person':'person-at-place',subject:detail,verb:detail.verb,noun:place,determiner:'the'})
  const name=person==='I'?'I':person[0].toUpperCase()+person.slice(1)
  return pattern==='question'
    ? {english:`Where ${detail.verb} ${person}?`,thai:`${detail.thai}อยู่ที่ไหน`,units:[
      {english:'Where',thai:'ที่ไหน'},{english:detail.verb,thai:'อยู่'},{english:`${person}?`,thai:detail.thai},
    ]}
    : {english:`${name} ${detail.verb} at the ${place.word}.`,thai:`${detail.thai}อยู่ที่${place.thai}`,units:[
      {english:name,thai:detail.thai},{english:detail.verb,thai:'อยู่'},{english:'at',thai:'ที่'},{english:'the',thai:'ที่กำลังพูดถึง'},{english:`${place.word}.`,thai:place.thai},
    ]}
}
export const peopleAudio = (sentence:string) => `/audio/race-lesson-three/people-${sentence.toLowerCase().replace(/[^a-z]+/g,'-').replace(/-$/,'')}.wav`

/** Names of places omit the article; verb agreement always belongs to the subject. */
export function locationAnswer(subject:SubjectWord,place:ClassroomWord,namedPlace=false) {
 const verb=subjectVerb(subject),name=subject.word[0].toUpperCase()+subject.word.slice(1)
 assertSentence({blueprint:'person-at-place',subject,verb,noun:namedPlace?{...place,meaning:{kind:'place',locationPrepositions:['at']}}:place,determiner:namedPlace?undefined:'the',namedPlace})
 return {english:`${name} ${verb} at ${namedPlace?'':'the '}${place.word}.`,thai:`${subject.thai}${subject.kind?' ':''}อยู่ที่${place.thai}`,
  units:[{english:name,thai:subject.thai},{english:verb,thai:'อยู่'},{english:'at',thai:'ที่'},
   ...(!namedPlace?[{english:'the',thai:'ที่กำลังพูดถึง'}]:[]),{english:`${place.word}.`,thai:place.thai}]}
}

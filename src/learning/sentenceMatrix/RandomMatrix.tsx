import {useState} from 'react'
import ExampleView from './ExampleView'
import {locationSentence,lessonDeterminers,type MatrixLesson} from './model'
import {actionDialogue,actionSubjects,actionVocabulary,objectsForAction,type ActionSubject} from '../sentenceRules/actionDialogue'
import VocabularyPicture from '../VocabularyPicture'
import WordSlotIcon from './WordSlotIcon'
import PronounIcon from './PronounIcon'
import {ActionIcon} from './ActionVocabularyIcon'
import Icon from '../../ui/Icon'
const pick=<T,>(items:readonly T[])=>items[Math.floor(Math.random()*items.length)]
export function randomExample(lesson:MatrixLesson){
 if(lesson.id==='lesson-3'&&Math.random()<.5){
  const action=pick(actionVocabulary),subject=pick(Object.keys(actionSubjects) as ActionSubject[])
  const object=pick(objectsForAction(action.word,lesson.vocabulary))
  const pair=actionDialogue(subject,action.word,{vocabulary:lesson.vocabulary,object:object?.word})
  const answer=Math.random()<.7,sentence=answer?pair.answer:pair.question
  const roles=sentence.units.map(unit=>unit.role)
  return {...sentence,layout:{construction:answer?'action-answer' as const:'action-question' as const,noun:roles.includes('determiner')?'phrase' as const:'single' as const,actionComplement:answer&&!!pair.object,leadingCount:answer&&pair.object?(roles.includes('preposition')?4:3):undefined},slots:roles.map(role=>role==='question'||role==='preposition'?0:role==='action'||role==='be'?1:role==='determiner'?2:3),icons:sentence.units.map(unit=>unit.role==='person'?<PronounIcon word={unit.english}/>:unit.role==='object'?<VocabularyPicture word={pair.object!.noun}/>:unit.role==='action'?answer?<ActionIcon word={action.word}/>:<img className="cw-game-icon" src="/classroom/icons/constructions/doing.png" alt=""/>:<WordSlotIcon slot={unit.role==='be'?1:unit.role==='determiner'?2:0} plural={unit.english==='are'}/>)}
 }
 const word=pick(lesson.vocabulary),sentence=locationSentence(word,pick(lessonDeterminers(lesson)).word)
 return {...sentence,layout:{construction:'question' as const,noun:'phrase' as const},slots:[0,1,2,3],icons:[<WordSlotIcon slot={0}/>,<WordSlotIcon slot={1} plural={sentence.verb==='are'}/>,<WordSlotIcon slot={2}/>,<VocabularyPicture word={word.word}/>]}
}
export default function RandomMatrix({lesson}:{lesson:MatrixLesson}){
 const [sentence,setSentence]=useState(()=>randomExample(lesson))
 return <section className="cw-sentence-board" aria-label="Random sentence"><div className="cw-sentence-display">
 <ExampleView matrix {...sentence} semanticSlots={sentence.slots} settings={{translations:false,explanations:false,wordPicker:false}} slotDetails={sentence.icons.map(icon=>({label:'',count:1,icon}))}/>
 <div className="cw-pattern-carousel"><button type="button" className="cw-sound" aria-label="Listen" onClick={()=>{speechSynthesis.cancel();const audio=new SpeechSynthesisUtterance(sentence.english);audio.lang='en-US';audio.rate=.85;speechSynthesis.speak(audio)}}><Icon name="sound"/></button><button type="button" className="cw-word-return" aria-label="Randomise sentence" onClick={()=>{speechSynthesis.cancel();setSentence(randomExample(lesson))}}><Icon name="arrow"/></button></div>
 </div></section>
}

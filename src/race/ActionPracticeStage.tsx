import PictureSentence from './PictureSentence'
import type {ReactNode} from 'react'
import LanguageQuadrant from '../learning/sentenceMatrix/LanguageQuadrant'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
import type {WordScores} from '../learning/wordProgress/model'
import type {ActionPracticeQuestion} from './actionPracticeContent'
import PracticeStage from './PracticeStage'
import PracticeHelpDialog from './PracticeHelpDialog'
import type {BinaryChoice} from './BinaryAnswerZone'

type Props={
 question:ActionPracticeQuestion;scores:WordScores;settings?:MatrixSettings;picked:number|null;
 disabled:boolean;onChoose:(side:number)=>void;onNext:()=>void;onHelp?:()=>void;review?:boolean;children?:ReactNode;onReplay?:()=>void;teacherControlled?:boolean
}
export default function ActionPracticeStage({question:q,scores,settings,picked,disabled,onChoose,onNext,onHelp,review=false,children,onReplay,teacherControlled}:Props){
 const documents=q.choices.map((_,side)=>{const units=side===q.correct?q.units:q.distractorUnits;return {english:units.map(unit=>unit.english).join(' '),thai:'',units,construction:q.level===4?'action-question' as const:'action-answer' as const}})
 const choices=documents.map((document,side)=>({id:String(side),label:document.english,content:<PictureSentence document={document} coloured={teacherControlled}/>,
  state:picked!==null&&side===q.correct?'correct':picked===side?'incorrect':undefined})) as [BinaryChoice,BinaryChoice]
 return <PracticeStage prompt="Listen, then choose" onReplay={onReplay} teacherControlled={teacherControlled} correct={picked===null?null:picked===q.correct}
  onNext={onNext} onHelp={onHelp}
  explanation={close=><PracticeHelpDialog onClose={close} title="Listen → choose the pictures"><div className="practice-help-pictures">{documents.map((document,index)=><PictureSentence key={index} document={document}/>)}</div></PracticeHelpDialog>}
  answers={{choices,selected:picked,disabled,onChoose}}
  question={<><div className="classroom foundation-noun"><div className="cw-sentence-board">
   <LanguageQuadrant scores={scores} request={{
    document:{...q,construction:q.level===4?'action-question':'action-answer'},
    presentation:{...settings,size:'phone',english:true,icons:true,keepIconsWhenFading:true,fadeMode:!review&&(settings?.fadeMode??true),
     thaiMeanings:false,thaiTranslation:false,explanations:false,wordPicker:false},
   }}/>
  </div></div>{children}</>}/>
}

import type {ReactNode} from 'react'
import LanguageQuadrant from '../learning/sentenceMatrix/LanguageQuadrant'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
import type {WordScores} from '../learning/wordProgress/model'
import type {ActionPracticeQuestion} from './actionPracticeContent'
import PracticeStage from './PracticeStage'
import PracticeHelpDialog from './PracticeHelpDialog'
import type {BinaryChoice} from './BinaryAnswerZone'

const hints={
 4:['ใครกำลังทำอะไร?', 'ฟังคำหลัง am, is หรือ are คำนั้นบอกว่ากำลังถามถึงใคร'],
 5:['ใครทำอะไร?', 'ฟังว่าใครอยู่ต้นประโยค แล้วฟังคำที่ลงท้ายด้วย -ing เพื่อรู้ว่าคนนั้นกำลังทำอะไร'],
 6:['ของใคร?', 'คนที่อยู่ต้นประโยคคือคนทำ ส่วนคำหน้าชื่อสิ่งของบอกเจ้าของ เช่น my คือของฉัน และ your คือของคุณ'],
} as const
type Props={
 question:ActionPracticeQuestion;scores:WordScores;settings?:MatrixSettings;picked:number|null;
 disabled:boolean;onChoose:(side:number)=>void;onNext:()=>void;onHelp?:()=>void;review?:boolean;children?:ReactNode
}
export default function ActionPracticeStage({question:q,scores,settings,picked,disabled,onChoose,onNext,onHelp,review=false,children}:Props){
 const [title,hint]=hints[q.level]
 const choices=q.choices.map((text,side)=>({id:String(side),label:text,content:text,
  state:picked!==null&&side===q.correct?'correct':picked===side?'incorrect':undefined})) as [BinaryChoice,BinaryChoice]
 return <PracticeStage prompt="ประโยคนี้แปลว่าอะไร?" correct={picked===null?null:picked===q.correct}
  onNext={onNext} onHelp={onHelp}
  explanation={close=><PracticeHelpDialog onClose={close} title={title}><p>{hint}</p></PracticeHelpDialog>}
  answers={{choices,selected:picked,disabled,onChoose}}
  question={<><div className="classroom foundation-noun"><div className="cw-sentence-board">
   <LanguageQuadrant scores={scores} request={{
    document:{...q,construction:q.level===4?'action-question':'action-answer'},
    presentation:{...settings,size:'phone',english:true,icons:true,keepIconsWhenFading:true,fadeMode:!review&&(settings?.fadeMode??true),
     thaiMeanings:review,thaiTranslation:review,explanations:false,wordPicker:false},
   }}/>
  </div></div>{children}</>}/>
}

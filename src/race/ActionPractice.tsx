import GeneratedPractice from './GeneratedPractice'
import type {PracticeLevel} from './PracticeLevelPicker'
import type {MatrixSettings} from '../learning/sentenceMatrix/model'
export default function ActionPractice(props:{level:4|5|6;onLevel:(level:PracticeLevel)=>void;userId?:string;settings?:MatrixSettings;onComplete?:(level:PracticeLevel,score:number,total:number,passed:boolean)=>void;onExit?:()=>void}){
 return <GeneratedPractice {...props}/>
}

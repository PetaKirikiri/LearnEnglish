import LanguageQuadrant,{type LanguageDocument} from '../learning/sentenceMatrix/LanguageQuadrant'
import {identificationQuestion} from '../learning/sentenceRules/identification'
import '../classroom/sentenceLine.css'
import './drawingPresentation.css'
export default function DrawingSentence({answer}:{answer?:string|null}){
 const parts=answer?.match(/^(a|an) (.+)$/)
 const document:LanguageDocument=answer===undefined?identificationQuestion('this'):{english:parts?`That is ${answer}.`:'That is a / an …',thai:'',construction:'identification-answer',units:[{english:'That',thai:'',role:'reference'},{english:'is',thai:'',role:'be'},{english:parts?.[1]??'a / an',thai:'',role:'determiner'},{english:parts?`${parts[2]}.`:'…',thai:'',role:'object'}]}
 return <div className="dg-sentence-boxes classroom" aria-label={document.english}><div className="cw-sentence-panel"><div className="cw-sentence-board"><LanguageQuadrant request={{document,presentation:{size:'compact',layout:{density:'briefing'},english:true,icons:false,thaiMeanings:false,thaiTranslation:false,explanations:false,wordPicker:false}}}/></div></div></div>
}

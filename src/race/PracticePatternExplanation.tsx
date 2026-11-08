import WordUsageVisual from '../learning/sentenceMatrix/WordUsageVisual'
import PracticeHelpDialog from './PracticeHelpDialog'
import PronunciationComparison from '../classroom/pronunciation/PronunciationComparison'
import {type NumberPrompt} from './numberFoundation'
import {numberItem} from './numberCatalogue'

/** One pattern explanation for every prompt; the same catalogue drives both forms. */
export default function PracticePatternExplanation({question,module,onClose}:{question:NumberPrompt;module:1|2|3;onClose:()=>void}){
 const noun=numberItem(question.word)
 if(!noun)return null
 const ending=noun.singular&&noun.plural?.startsWith(noun.singular)?noun.plural.slice(noun.singular.length):null
 return <PracticeHelpDialog title={module===1?'หนึ่งสิ่ง · หลายสิ่ง':'จำนวนกับ is / are'} onClose={onClose}>
   <WordUsageVisual item={{...noun,word:question.word,number:question.plural?'plural':'singular'}} showAgreement={module!==1} nounPhrase language="th"/>
   <div className="practice-pattern-ending"><span className="cw-game-icon cw-game-icon-apples" aria-hidden="true"/><span>{noun.pairOnly?'คำนี้ใช้รูปพหูพจน์ แม้มีหนึ่งคู่':'ฟังรูปคำที่เปลี่ยนไป'} {ending&&<strong lang="en">+{ending}</strong>}</span></div>
   <PronunciationComparison word={question.word} allowEdit={false} language="th"/>
 </PracticeHelpDialog>
}

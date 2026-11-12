import type {GeneratedQuestion} from './generatedPracticeContent'
import {fixedWordReferences} from '../learning/sentenceMatrix/wordReference'
import {meaningForWord} from '../learning/sentenceRules/blueprints'
import {useLanguage,t} from '../classroom/language'
import AgreementPairs from '../learning/sentenceMatrix/AgreementPairs'
import {subjectPronouns,subjectVerb} from '../learning/sentenceMatrix/subjectEngine'
import PronounIcon from '../learning/sentenceMatrix/PronounIcon'
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
 return <PracticeHelpDialog title={module===1?'One · More than one':'One → is · More than one → are'} onClose={onClose}>
   <WordUsageVisual item={{...noun,word:question.word,number:question.plural?'plural':'singular'}} showAgreement={module!==1} nounPhrase language="en"/>
   <div className="practice-pattern-ending"><span className="cw-game-icon cw-game-icon-apples" aria-hidden="true"/><span>{noun.pairOnly?'คำนี้ใช้รูปพหูพจน์ แม้มีหนึ่งคู่':'ฟังรูปคำที่เปลี่ยนไป'} {ending&&<strong lang="en">+{ending}</strong>}</span></div>
   <PronunciationComparison word={question.word} allowEdit={false} language="en"/>
 </PracticeHelpDialog>
}

/** Adaptive practice uses the existing teaching material for the word actually
 * being tested. Help explains usage, agreement/forms and pronunciation; it is
 * never a second picture-only rendering of the question. */
export function AdaptivePracticeExplanation({question,onClose}:{question:Pick<GeneratedQuestion,'document'|'targetWords'|'level'|'credit'>;onClose:()=>void}){
 const language=useLanguage(),th=language==='th',units=question.document.units
 const clean=(word:string)=>word.toLowerCase().replace(/[?.!]$/,'')
 const lexical=question.targetWords.filter(word=>!['am','is','are'].includes(clean(word))),targets=lexical.length?lexical:question.targetWords
 const focus=units.find(unit=>targets.some(word=>clean(word)===clean(unit.english)))??units.find(unit=>unit.role==='be')??units[units.length-1]
 const word=focus.english.replace(/[?.!]$/,''),subjectUnit=units.find(unit=>unit.role==='person'),nounUnit=focus.role==='person'||focus.role==='object'?focus:focus.role==='be'&&subjectUnit?subjectUnit:units.find(unit=>unit.role==='object'),noun=nounUnit&&numberItem(clean(nounUnit.english))
 const nominal=focus.role==='object'||focus.role==='person'&&!!numberItem(clean(word)),agreement=focus.role==='be'||focus.role==='person'||question.document.construction==='question'
 if(noun&&(nominal||focus.role==='be')&&meaningForWord(noun)?.countability!=='mass')return <PracticePatternExplanation question={{id:'help',word:noun.word,thai:noun.thai,plural:noun.pluralForm,audioUrl:''}} module={agreement?2:1} onClose={onClose}/>
 const detail=fixedWordReferences[clean(word)]??fixedWordReferences[word]
 const reference=['this','that','that over there','these','those'].includes(clean(word))
 const role=focus.role
 const explanation=detail&&role!=='be'?t(detail.function):reference
  ?th?'this อยู่ใกล้ผู้พูด · that อยู่ใกล้ผู้ฟัง · that over there อยู่ไกลจากทั้งสองคน · these / those ใช้กับหลายสิ่ง':'This is near the speaker; that is near the listener; that over there is away from both. These and those refer to more than one.'
  :role==='person'||role==='be'
  ?th?'ใช้คำสรรพนามแทนคนที่พูดถึง รูปคำกริยาเปลี่ยนตามคำสรรพนาม':'A pronoun stands for the person or thing being discussed. The verb agrees with that pronoun.'
  :role==='action'
  ?th?'กริยาหลักบอกว่าประธานกำลังทำอะไร ใช้ am / is / are ให้ตรงกับประธาน แล้วตามด้วยกริยารูป -ing':'The main verb tells us what the subject is doing. Match am / is / are to the subject, then use the -ing verb.'
  :role==='description'
  ?th?'คำคุณศัพท์อยู่หน้าคำนามเพื่อบอกลักษณะ รูปคำคุณศัพท์ไม่เปลี่ยนตามจำนวนของคำนาม':'An adjective describes the noun and goes before it. The adjective stays the same for one or more than one.'
  :nominal&&noun&&meaningForWord(noun)?.countability==='mass'
  ?th?'คำนี้เป็นคำนามนับไม่ได้ในความหมายนี้ ไม่เติม -s และไม่ใช้ a / an ข้างหน้า':'This meaning is uncountable. Do not add -s or put a / an before it.'
  :['a','an'].includes(clean(word))
  ?th?'a / an ใช้กับคำนามนับได้หนึ่งสิ่งที่ไม่ได้เจาะจง ใช้ a หน้าเสียงพยัญชนะ และ an หน้าเสียงสระ':'A / an introduces one non-specific countable thing. Use a before a consonant sound and an before a vowel sound.'
  :clean(word)==='some'
  ?th?'some บอกจำนวนที่ไม่เจาะจง ใช้กับคำนามพหูพจน์หรือคำนามนับไม่ได้':'Some gives an unspecified amount. Use it with plural countable nouns or uncountable nouns.'
  :th?'ดูหน้าที่ของคำและคำที่เชื่อมกันในประโยค':'Look at this word’s role and the words it connects to.'
 return <PracticeHelpDialog title={th?'การใช้คำนี้':'How it works'} onClose={onClose}>
  <section className="cw-reference-word">
   <h3>{word} · <span lang="th">{focus.thai}</span></h3>
   <p className="cw-reference-function">{explanation}</p>
   {detail&&role!=='be'&&<dl className="cw-reference-rows">{detail.usage.map(([label,value])=><div key={label}><dt>{t(label)}</dt><dd>{t(value)}</dd></div>)}</dl>}
   {(role==='person'||role==='be')&&!nominal&&<AgreementPairs pairs={subjectPronouns.filter(person=>person.word!=='it').map(person=>({person:person.word,verb:subjectVerb(person),icon:<PronounIcon word={person.word}/>,selected:person.word.toLowerCase()===clean(subjectUnit?.english??word)}))}/>}
   {role==='action'&&<p>{units.some(unit=>unit.role==='preposition'&&unit.english==='to')?(th?'ในรูปแบบนี้ ใช้ to ก่อนคนหรือจุดหมายที่ไปหา':'In this pattern, put to before the person or destination.'):(th?'ในรูปแบบนี้ วางสิ่งที่ถูกกระทำไว้หลังกริยาโดยตรง':'In this pattern, the object goes directly after the main verb.')}</p>}
  </section>
  <PronunciationComparison word={word} allowEdit={false} language={language}/>
 </PracticeHelpDialog>
}

import PracticeStage from './PracticeStage'
import BinaryAnswerZone from './BinaryAnswerZone'
import ExampleLanguage from '../learning/ExampleLanguage'
import WordSlotIcon from '../learning/sentenceMatrix/WordSlotIcon'
import PronounIcon from '../learning/sentenceMatrix/PronounIcon'
import VocabularyPicture from '../learning/VocabularyPicture'

function Sentence({full=false}:{full?:boolean}){
 const words=full?['I','am','at','the','hotel']:['the','hotel']
 const meanings=full?['ฉัน','อยู่','ที่','ที่กำลังพูดถึง','โรงแรม']:['ที่กำลังพูดถึง','โรงแรม']
 return <div className="classroom foundation-noun"><div className="cw-sentence-board"><ExampleLanguage matrix semanticSlots={full?[3,1,0,2,3]:[2,3]} layout={{construction:full?'location-answer':'noun-phrase',noun:'phrase',subjectVerbConnection:full?'warm':undefined}} settings={{explanations:false,wordPicker:false,explanationSelection:false,audio:false,layout:{density:'content',maxWidth:520}}} slotDetails={words.map((word)=>({label:word,count:0,icon:word==='hotel'?<VocabularyPicture word={word}/>:word==='I'?<PronounIcon word={word}/>:<WordSlotIcon slot={word==='am'?1:word==='at'?0:2}/>}))} english={words.join(' ')} thai="" units={words.map((word,i)=>({english:word,thai:meanings[i]}))}/></div></div>
}
/** Development-only fixtures use the real stage, engine and answer component. */
export default function PracticeLayoutFixture(){
 const matrix=new URLSearchParams(location.search).get('answers')==='matrix'
 return <main className="phone-practice foundation-practice"><div className="practice-shell"><header><img className="foundation-cap" src="/brand/success-university-su.svg" alt="Success University"/><progress className="foundation-progress" value={15} max={30} aria-label="ความคืบหน้าของบทฝึก"/></header><PracticeStage question={<Sentence full/>} answers={<BinaryAnswerZone disabled={false} selected={null} onChoose={()=>{}} choices={matrix?[{id:'a',label:'the hotel',content:<Sentence/>},{id:'b',label:'I am at the hotel',content:<Sentence full/>}]:[{id:'a',label:'I am at the hotel',content:'I am at the hotel.'},{id:'b',label:'They are at the hospital',content:'They are at the hospital near the school with their mother and father.'}]}/>}/></div></main>
}

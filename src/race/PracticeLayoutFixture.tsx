import LanguageQuadrant from '../learning/sentenceMatrix/LanguageQuadrant'
import {actionDialogue} from '../learning/sentenceRules/actionDialogue'
import {generatedNumberCatalogue} from './numberCatalogue'
import PictureSentence from './PictureSentence'
import PracticeStage from './PracticeStage'
import {useState} from 'react'
import PracticeHelpDialog from './PracticeHelpDialog'
import ExampleLanguage from '../learning/ExampleLanguage'
import WordSlotIcon from '../learning/sentenceMatrix/WordSlotIcon'
import PronounIcon from '../learning/sentenceMatrix/PronounIcon'
import VocabularyPicture from '../learning/VocabularyPicture'

function Sentence({full=false}:{full?:boolean}){
 const words=full?['I','am','at','the','hotel']:['the','hotel']
 const meanings=full?['ฉัน','อยู่','ที่','ที่กำลังพูดถึง','โรงแรม']:['ที่กำลังพูดถึง','โรงแรม']
 return <div className="classroom foundation-noun"><div className="cw-sentence-board"><ExampleLanguage matrix semanticSlots={full?[3,1,0,2,3]:[2,3]} layout={{construction:full?'location-answer':'noun-phrase',noun:'phrase',}} settings={{explanations:false,wordPicker:false,explanationSelection:false,audio:false,layout:{density:'content',maxWidth:520}}} slotDetails={words.map((word)=>({label:word,count:0,icon:word==='hotel'?<VocabularyPicture word={word}/>:word==='I'?<PronounIcon word={word}/>:<WordSlotIcon slot={word==='am'?1:word==='at'?0:2}/>}))} english={words.join(' ')} thai="" units={words.map((word,i)=>({english:word,thai:meanings[i]}))}/></div></div>
}
/** Development-only fixtures use the real stage, engine and answer component. */
export default function PracticeLayoutFixture(){
 const [picked,pick]=useState<number|null>(null)
 const matrix=new URLSearchParams(location.search).get('answers')==='matrix'
 if(new URLSearchParams(location.search).get('answers')==='people'){
  const words=['this','that','that over there']
  return <main className="phone-practice foundation-practice"><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16,padding:24}}>{words.map(word=><figure key={word} style={{margin:0,display:'grid',justifyItems:'center',gap:12,padding:12,borderRadius:18,background:'var(--sentence-noun-fill)',color:'var(--sentence-noun-ink)'}}><span style={{width:'100%',aspectRatio:'3/2'}}><WordSlotIcon slot={2} word={word}/></span><figcaption style={{fontWeight:800}}>{word}</figcaption><span style={{width:48,height:48}}><WordSlotIcon slot={2} word={word}/></span></figure>)}</div></main>
 }

 if(new URLSearchParams(location.search).get('answers')==='icons'){
  const words=['the','a','an','some','this','that','that over there','these','those','my','your','his','her','our','their']
  return <main className="phone-practice foundation-practice"><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:16,padding:24}}>{words.map(word=><figure key={word} style={{margin:0,display:'grid',justifyItems:'center',gap:12,padding:16,borderRadius:18,background:'var(--sentence-noun-fill)',color:'var(--sentence-noun-ink)'}}><span style={{width:48,height:48}}><WordSlotIcon slot={2} word={word}/></span><figcaption>{word}</figcaption></figure>)}</div></main>
 }

 if(new URLSearchParams(location.search).get('answers')==='linked'){
  const make=(object:string)=>({...actionDialogue('i','holding',{vocabulary:generatedNumberCatalogue,object,determiner:'the'}).answer,construction:'action-answer' as const})
  const correct=make('a bag'),other=make('a phone')
  return <main className="phone-practice foundation-practice"><div className="practice-shell"><PracticeStage
   question={<div className="classroom foundation-noun"><div className="cw-sentence-board"><LanguageQuadrant request={{document:correct,presentation:{size:'phone',audio:false,wordPicker:false,explanations:false}}}/></div></div>}
   explanation={close=><PracticeHelpDialog onClose={close} title="Listen"><PictureSentence document={correct}/></PracticeHelpDialog>}
   prompt="Listen, then choose" correct={picked===null?null:picked===0} onNext={()=>pick(null)}
   answers={{disabled:false,selected:picked,onChoose:pick,choices:[{id:'correct',label:correct.english,content:<PictureSentence document={correct}/>},{id:'other',label:other.english,content:<PictureSentence document={other}/>}]}}/>
  </div></main>
 }

 if(new URLSearchParams(location.search).get('descriptions')==='both'){
  const line=actionDialogue('he','holding',{vocabulary:generatedNumberCatalogue,subject:{word:'the man',thai:'ผู้ชาย',kind:'person',phrase:{noun:'man',nounThai:'ผู้ชาย',determiner:{english:'the',thai:'ที่กำลังพูดถึง'},description:{english:'tall',thai:'ตัวสูง'}}},object:'a bag',determiner:'the',description:{english:'red',thai:'สีแดง'}}).answer
  if(new URLSearchParams(location.search).has('fade')){
   const document={...line,construction:'action-answer' as const}
   const fade=new URLSearchParams(location.search).get('fade')
   const words=fade==='full'?document.english.toLowerCase().match(/[a-z]+/g)??[]:['man','holding','bag']
   const scores=Object.fromEntries(words.map(word=>['en:'+word,25]))
   return <main className="phone-practice foundation-practice"><div className="practice-shell"><PracticeStage
    question={<div className="classroom foundation-noun"><div className="cw-sentence-board"><LanguageQuadrant scores={scores} request={{document,presentation:{fadeMode:true,keepIconsWhenFading:true,audio:false,wordPicker:false,explanations:false,size:'phone'}}}/></div></div>}
    explanation={close=><PracticeHelpDialog onClose={close} title="Listen"><PictureSentence document={document}/></PracticeHelpDialog>}
    prompt="Listen, then choose" correct={picked===null?null:picked===0} onNext={()=>pick(null)}
    answers={{disabled:false,selected:picked,onChoose:pick,choices:[{id:'correct',label:document.english,content:<PictureSentence document={document}/>},{id:'other',label:'the red bag',content:<PictureSentence document={{english:'the red bag',thai:'',construction:'noun-phrase',units:document.units.filter(u=>['determiner','description','object'].includes(u.role)&&u.english!=='tall')}}/>}]}}/>
   </div></main>
  }
  return <main className="phone-practice foundation-practice"><div className="practice-shell"><div className="classroom foundation-noun"><div className="cw-sentence-board"><LanguageQuadrant request={{document:{...line,construction:'action-answer'},presentation:{layout:{density:'content',maxWidth:1000},audio:false,wordPicker:false,explanations:false}}}/></div></div></div></main>
 }
 return <main className="phone-practice foundation-practice"><div className="practice-shell"><header><img className="foundation-cap" src="/brand/success-university-su.svg" alt="Success University"/><progress className="foundation-progress" value={15} max={30} aria-label="ความคืบหน้าของบทฝึก"/></header><PracticeStage question={<Sentence full/>}
 prompt="ประโยคนี้แปลว่าอะไร?" correct={picked===null?null:picked===1} onNext={()=>pick(null)}
 explanation={close=><PracticeHelpDialog title="บอกสถานที่" onClose={close}>ฟังว่าใครอยู่ที่ไหน</PracticeHelpDialog>}
 answers={{disabled:picked!==null,selected:picked,onChoose:pick,choices:matrix?[{id:'a',label:'the hotel',content:<Sentence/>},{id:'b',label:'I am at the hotel',content:<Sentence full/>}]:[{id:'a',label:'I am at the hotel',content:'I am at the hotel.'},{id:'b',label:'They are at the hospital',content:'They are at the hospital near the school with their mother and father.'}]}}/></div></main>
}

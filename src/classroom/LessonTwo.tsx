import { useEffect, useRef, useState } from 'react'
import ExampleLanguage from '../learning/ExampleLanguage'
import VocabularyPicture from '../learning/VocabularyPicture'
import Icon from '../ui/Icon'
import { LanguageSwitch } from './LanguageSwitch'
import { useLanguage } from './language'
import type { LessonPage } from './lessonOne'
import ClassroomRace from './ClassroomRace'
import { lessonTwoAudio } from '../race/lessonTwoQuestions'
import { lessonTwoWords, lessonTwoPairs, lessonTwoStages, numberSentence, ownerThai, type LessonTwoWord, type Owner } from './lessonTwoContent'
import './lesson.css'
import './lessonTwo.css'

const lessonTwoSteps = ['words','number','my','your','more','pairs'] as const
const shop: LessonTwoWord = {singular:'shop',plural:'shops',thai:'ร้านค้า',classifier:'ร้าน'}
export default function LessonTwo({ page }: { page: LessonPage }) {
  const language = useLanguage()
  const tr = (th:string,en:string) => language === 'th' ? th : en
  const [step,setStep] = useState(0)
  const lastStep = lessonTwoSteps.length - 1
  const [word,setWord] = useState(0)
  const [owner,setOwner] = useState<Owner>('the')
  const [pair,setPair] = useState(0)
  const [choice,setChoice] = useState<string | null>(null)
  const audio = useRef<HTMLAudioElement>(null)
  const [audioError,setAudioError] = useState(false)
  useEffect(() => { const player=audio.current; return () => {player?.pause(); window.speechSynthesis?.cancel()} },[page,step,word,pair,owner])
  const item = step === 5 ? lessonTwoPairs[pair] : lessonTwoWords[word]
  const titles = {recall:tr('รูปแบบที่รู้แล้ว','The pattern we know'),idea:tr('หนึ่ง → หลาย','One → more than one'),example:tr('เปลี่ยนจำนวน เปลี่ยนคำ','Change the number, change the word'),mistake:tr('ดูจำนวน แล้วเลือก','Look at the number'),practice:tr('แข่งไปด้วยกัน','Race together'),review:tr('จำนวน กับเจ้าของ','Number and ownership')}
  const steps = [tr('คำศัพท์','Words'),tr('หนึ่ง → หลาย','One → many'),tr('ของฉัน','Mine'),tr('ของคุณ','Yours'),tr('คำอื่น ๆ','More words'),tr('แว่นตา · กางเกง','Glasses · trousers')]
  function changeStep(index:number) {setStep(index);setWord(0);setPair(0);setChoice(null);setOwner(index===2?'my':index===3?'your':'the')}
  async function play(value:LessonTwoWord,plural:boolean,determiner:Owner) {
    const sentence=numberSentence(value,plural,determiner)
    setAudioError(false)
    if(value===shop) {
      window.speechSynthesis?.cancel()
      const speech=new SpeechSynthesisUtterance(sentence.english);speech.lang='en-US';speech.rate=.85
      speech.onerror=()=>setAudioError(true);window.speechSynthesis?.speak(speech);return
    }
    if(audio.current){audio.current.src=lessonTwoAudio(sentence.noun,determiner,sentence.verb);try{await audio.current.play()}catch{setAudioError(true)}}
  }
  function matrix(value:LessonTwoWord,plural:boolean,determiner:Owner) {
    const sentence=numberSentence(value,plural,determiner)
    return <div className="l2-pattern cw-sentence-board" data-number={plural?'plural':'singular'}>
      <div className="l2-number-picture"><VocabularyPicture word={sentence.noun} count={value.singular?(plural?3:1):1}/><span>{value.singular ? plural?'2+':'1' : tr('ใช้ are','Use are')}</span></div>
      <ExampleLanguage matrix groupLastTwo english={sentence.english} thai={sentence.thai} units={sentence.units} translationControl={<button className="cw-sound" aria-label={`${tr('ฟัง','Listen')}: ${sentence.english}`} onClick={()=>void play(value,plural,determiner)}><Icon name="sound"/></button>}/>
    </div>
  }
  function words(all=false) {
    const choices=all?lessonTwoWords:lessonTwoWords.slice(0,6)
    return <div className="l2-words" role="group" aria-label={tr('เลือกสิ่งของ','Choose an object')}>{choices.map((value,index)=><button key={value.singular} aria-pressed={word===index} onClick={()=>{setWord(index);setChoice(null)}}><VocabularyPicture word={value.singular} count={1}/><strong>{value.singular}</strong><span>{value.thai}</span></button>)}</div>
  }
  const hint=step===0?tr('เริ่มจากชื่อสิ่งของทีละคำ ชี้ภาพ แล้วลองพูด','Start with the objects. Point to each picture and say the word.'):
    step===1?tr('หนึ่งสิ่งใช้ is · มากกว่าหนึ่งใช้ are · คำเหล่านี้เติม s','One takes is. More than one takes are. These nouns add s.'):
    step===2?tr('my = ของผู้พูด · ใช้ได้ทั้งหนึ่งสิ่งและหลายสิ่ง','my means belonging to the speaker. It works with one or several.'):
    step===3?tr('your = ของคนที่เราพูดด้วย · จำนวนยังเป็นตัวกำหนด is / are','your means belonging to the listener. The noun still decides is / are.'):
    step===4?tr('เปลี่ยนทีละอย่าง: สิ่งของ → จำนวน → เจ้าของ','Change one thing at a time: object, number, then owner.'):
    tr('แว่นตาหนึ่งอัน หรือกางเกงหนึ่งตัว ก็ใช้ are · ไม่ตัด s ออก','Even one pair takes are. Do not remove the s.')
  return <div lang={language} style={{display:'contents'}}><LanguageSwitch/>{page==='practice'?<ClassroomRace key="lesson-2" lessonId="lesson-2" stages={lessonTwoStages}/>:<section className="cw-sentence-panel l2-panel">
    <header className="cw-panel-header"><span className="cw-panel-lesson">{tr('บทเรียน 02','Lesson 02')}</span><div className="cw-panel-header-main"><h1 id="note-title">{titles[page]}</h1></div></header>
    <audio ref={audio} preload="none"/>
    {audioError&&<p role="alert">{tr('เล่นเสียงไม่ได้ ลองกดอีกครั้ง','Could not play audio. Try again.')}</p>}
    {page==='recall'?<div className="l2-body">{matrix(shop,false,'the')}<p className="l2-hint">{tr('ยังถามว่า “อยู่ที่ไหน?” เริ่มจากร้านหนึ่งร้าน','We still ask where something is. Start with one shop.')}</p></div>:
    page==='mistake'?<div className="l2-body">{matrix(lessonTwoWords[0],true,'my')}<p className="l2-hint">{tr('รองเท้ามากกว่าหนึ่งข้าง ใช้คำไหนในช่องที่สอง?','There is more than one shoe. Which word goes in slot two?')}</p><div className="cw-segments">{['is','are'].map(verb=><button key={verb} aria-pressed={choice===verb} onClick={()=>setChoice(verb)}>{verb}</button>)}</div>{choice&&<p className="l2-hint" role="status">{choice==='are'?tr('✓ หลายสิ่ง → are','✓ More than one → are'):tr('ลองอีกครั้ง: is ใช้กับหนึ่งสิ่งในรูปแบบนี้','Try again: is goes with one thing in this pattern.')}</p>}<p className="l2-hint">{tr('my ไม่ได้ทำให้ใช้ is · ให้ดูจำนวนของคำนาม','my does not mean is. Look at the number of the noun.')}</p></div>:
    page==='review'?<div className="l2-body">{matrix(lessonTwoWords[0],false,'my')}{matrix(lessonTwoWords[0],true,'your')}<p className="l2-hint">{tr('ชี้สิ่งของหนึ่งชิ้นหรือหลายชิ้น ให้เพื่อนถาม แล้วสลับเจ้าของ','Point to one or several objects. Ask a partner, then change whose objects they are.')}</p><a className="cw-race-entry" href="?lesson=2#race-guide"><Icon name="flag"/>{tr('ไปแข่ง','Race together')}</a></div>:
    <><nav className="l2-steps" aria-label={tr('ลำดับการเรียน','Learning steps')}>{steps.map((label,index)=><button key={label} aria-current={step===index?'step':undefined} onClick={()=>changeStep(index)}><small>{index+1}</small>{label}</button>)}</nav><div className="l2-body">
      {step===0?<>{words()}<div className="l2-single-word"><VocabularyPicture word={item.singular!}/><ExampleLanguage matrix english={item.singular!} thai={item.thai} units={[{english:item.singular!,thai:item.thai}]}/></div></>:
      <>{step===4?words(true):step===5?<div className="cw-segments">{lessonTwoPairs.map((value,index)=><button key={value.plural} aria-pressed={pair===index} onClick={()=>setPair(index)}><VocabularyPicture word={value.plural} count={1}/>{value.plural}</button>)}</div>:words()}
        {step>=3&&<div className="cw-segments" aria-label={tr('สิ่งไหน / ของใคร','Which / whose')}>{(['the','my','your'] as const).map(value=><button key={value} aria-pressed={owner===value} onClick={()=>setOwner(value)}>{value}<small>{ownerThai(value)}</small></button>)}</div>}
        <div className="l2-comparison">{item.singular&&matrix(item,false,owner)}{matrix(item,true,owner)}</div>
      </>}
      <p className="l2-hint">{hint}</p>
      <div className="l2-next"><button disabled={step===0} onClick={()=>changeStep(step-1)} aria-label={tr('ย้อนกลับ','Previous')}>←</button><button disabled={step===lastStep} onClick={()=>changeStep(step+1)} aria-label={tr('ถัดไป','Next')}>→</button></div>
    </div></>}
  </section>}</div>
}

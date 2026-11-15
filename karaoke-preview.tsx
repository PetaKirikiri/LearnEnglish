import PlaybackSpeedControls from './src/audio/PlaybackSpeedControls'
import {usePlaybackMode} from './src/audio/usePlaybackMode'
import React,{useEffect,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import LanguageQuadrant from './src/learning/sentenceMatrix/LanguageQuadrant'
import {playTimedSentence as playSentenceAudio} from './src/audio/sentenceAudio'
import type {SpokenWord} from './src/audio/sentenceTiming'
import {loadAudioWaveform,waveformAtTime} from './src/audio/audioWaveform'
import './src/classroom/lesson.css'
import './src/classroom/sentenceLine.css'

if(!import.meta.env.DEV)throw Error('Local preview only')
import type {LanguageDocument} from './src/learning/sentenceMatrix/LanguageQuadrant'
const examples:Array<{name:string;audio:string;document:LanguageDocument}>=[
 {name:'Location question',audio:'where-shoe',document:{english:'Where is my shoe?',thai:'รองเท้าของฉันอยู่ที่ไหน',construction:'question',units:[{english:'Where',thai:'ที่ไหน',role:'question'},{english:'is',thai:'อยู่',role:'be'},{english:'my',thai:'ของฉัน',role:'determiner'},{english:'shoe?',thai:'รองเท้า',role:'object'}]}},
 {name:'Location statement',audio:'at-hotel',document:{english:'I am at the hotel.',thai:'ฉันอยู่ที่โรงแรม',construction:'location-answer',units:[{english:'I',thai:'ฉัน',role:'person'},{english:'am',thai:'อยู่',role:'be'},{english:'at',thai:'ที่',role:'preposition'},{english:'the',thai:'',role:'determiner'},{english:'hotel.',thai:'โรงแรม',role:'object'}]}},
 {name:'Action statement',audio:'hotel',document:{english:'I am going to the hotel.',thai:'ฉันกำลังไปที่โรงแรม',construction:'action-answer',units:[{english:'I',thai:'ฉัน',role:'person'},{english:'am',thai:'กำลัง',role:'be'},{english:'going',thai:'ไป',role:'action'},{english:'to',thai:'ที่',role:'preposition'},{english:'the',thai:'',role:'determiner'},{english:'hotel.',thai:'โรงแรม',role:'object'}]}},
]
function Preview(){
 const [selected,setSelected]=useState(0)
 return <><nav style={{display:'flex',gap:10,padding:'20px 4vw'}}>{examples.map((example,index)=><button key={example.audio} aria-pressed={selected===index} onClick={()=>setSelected(index)} style={{padding:'10px 16px',borderRadius:12,border:'1px solid #b4cbe3',background:selected===index?'#1877ef':'white',color:selected===index?'white':'#18385e',cursor:'pointer'}}>{example.name}</button>)}</nav><SentencePreview key={selected} example={examples[selected]}/></>
}
function SentencePreview({example}:{example:typeof examples[number]}){
 const text=example.document.english
 const question={id:example.audio,document:example.document,audioUrl:`/audio/kokoro-preview/${example.audio}.wav`,timingUrl:`/audio/kokoro-preview/${example.audio}.timing.json`}
 const [word,setWord]=useState<SpokenWord|null>(null),[visible]=useState(true),[error,setError]=useState(false)
 const audioWave=useRef<{level:number;time:number;progress?:number;recording?:import('./src/audio/audioWaveform').AudioWaveform}>({level:0,time:0})
 const [mode,chooseMode]=usePlaybackMode()
 const stop=useRef<(()=>void)|null>(null)
 useEffect(()=>{let active=true;void loadAudioWaveform(question.audioUrl).then(recording=>{if(active&&recording)audioWave.current.recording=recording});return()=>{active=false;stop.current?.()}},[])
 function play(selectedMode=mode){
  setError(false)
  stop.current?.()
  stop.current=playSentenceAudio(question,{
   waveform:(level,time,progress,recording)=>{audioWave.current.level=audioWave.current.recording?waveformAtTime(audioWave.current.recording,time):level;audioWave.current.time=time;audioWave.current.progress=progress;if(recording)audioWave.current.recording=recording},word:setWord,started:()=>{},ended:()=>{},error:()=>setError(true),
  },selectedMode)
 }
 const scores=Object.fromEntries(text.toLowerCase().replace(/[.?]/g,'').split(' ').map(word=>['en:'+word,25]))
 return <main className="classroom" style={{display:'block',minHeight:'100dvh',background:'#fff',padding:'clamp(16px,4vw,48px)'}}>
  <div style={{maxWidth:1100,margin:'0 auto'}}>
   <PlaybackSpeedControls mode={mode} onChange={next=>{chooseMode(next);play(next)}}/>
   {error&&<p role="alert">Audio could not play. Tap the turtle or rabbit to retry.</p>}
   <div className="cw-sentence-board"><div className="cw-sentence-display">
    <LanguageQuadrant scores={scores} request={{
     document:example.document,
     presentation:{spokenWord:word,audioWave:audioWave.current,fadeMode:!visible,english:true,icons:true,keepIconsWhenFading:true,thaiMeanings:visible,thaiTranslation:visible},
    }}/>
   </div></div>
  </div>
 </main>
}
createRoot(document.getElementById('root')!).render(<Preview/>)

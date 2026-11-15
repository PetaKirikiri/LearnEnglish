import PlaybackButtons from '../audio/PlaybackButtons'
import { useEffect } from 'react'
import ExampleLanguage from '../learning/ExampleLanguage'
import { speakEnglish, stopEnglishSpeech } from '../learning/speech'
import { classOneExamples, classOneStages } from './classOne'
import './classOne.css'

export default function ClassOneMaterial(){
  useEffect(()=>()=>stopEnglishSpeech(),[])
  return <section className="class-one-material" aria-label="Class 1 material">
    {classOneStages.map((stage,index)=><section key={stage.id} aria-label={stage.title}>
      <h2>{index+1}. {stage.title}</h2>
      {stage.id==='first-questions'?stage.questions.map(question=>{
        const example=classOneExamples.find(e=>e.english===question.english)!
        return <article className="class-one-example" key={question.id}><ExampleLanguage {...example}/><PlaybackButtons label={`Listen: ${question.english}`} onPlay={()=>speakEnglish(question.english,question.audioUrl)}/></article>
      }):<div className="class-one-words">{stage.questions.map(question=><div key={question.id}><span lang="en">{question.english}</span><span lang="th">{question.answers[question.correct][0].text}</span><PlaybackButtons label={`Listen: ${question.english}`} onPlay={()=>speakEnglish(question.english,question.audioUrl)}/></div>)}</div>}
    </section>)}
  </section>
}

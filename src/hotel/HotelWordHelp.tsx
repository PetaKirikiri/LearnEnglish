import { useState } from 'react'
import WordHelp from '../learning/WordHelp'
import { initializeLanguageDatabase } from '../lib/languageDatabase'
import { hotelWordGlosses } from './wordGlosses'
import { speakEnglish } from '../learning/speech'
import type { HotelQuestion } from './course'
import './word-help.css'
import { catalogueWordProfiles, hotelWordProfiles, hotelWordExamples } from './wordProfiles'
import { getCurriculum } from '../curriculum/database'

export default function HotelWordHelp({ question, onListen, tokenOpacity, onHelp }: { question: HotelQuestion; onListen?: () => void; tokenOpacity?: (word: string) => number; onHelp?: (word: string) => void }) {
  const [, refresh] = useState(0)
  const catalogue=getCurriculum()
  const profiles=catalogue?.version===2?catalogueWordProfiles(catalogue.questions,catalogue.revision):hotelWordProfiles
  const translations=catalogue?.version===2?{...hotelWordGlosses,...Object.fromEntries(catalogue.vocabulary.map(w=>[w.word,w.thai]))}:hotelWordGlosses
  return <WordHelp text={question.english} translations={translations} theme="hotel"
    profiles={profiles} examplesForWord={(word,context)=>{
      const needle=word.toLowerCase()
      const current=catalogue?.questions.filter(q=>Array.from(q.english.toLowerCase().matchAll(/[a-z]+(?:'[a-z]+)*/g),m=>m[0]).includes(needle)).map(q=>q.english)??[]
      return [...new Set([context,...current,...hotelWordExamples(word,context)])].slice(0,5)
    }}
    tokenOpacity={tokenOpacity} onHelp={onHelp}
    onListen={onListen ?? (() => speakEnglish(question.english, question.audioUrl))}
    onOpenChange={open => {
      // Load FIFA's shared word profiles on demand; offline Hotel glosses remain
      // usable if neither the database nor its saved snapshot is available.
      if (open) void initializeLanguageDatabase().then(() => refresh(n => n + 1), () => {})
    }} />
}

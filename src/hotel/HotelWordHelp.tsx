import { useState } from 'react'
import WordHelp from '../learning/WordHelp'
import { initializeLanguageDatabase } from '../lib/languageDatabase'
import { hotelWordGlosses } from './wordGlosses'
import { speakEnglish } from '../learning/speech'
import type { HotelQuestion } from './course'
import './word-help.css'

export default function HotelWordHelp({ question, onListen }: { question: HotelQuestion; onListen?: () => void }) {
  const [, refresh] = useState(0)
  return <WordHelp text={question.english} translations={hotelWordGlosses} theme="hotel"
    onListen={onListen ?? (() => speakEnglish(question.english, question.audioUrl))}
    onOpenChange={open => {
      // Load FIFA's shared word profiles on demand; offline Hotel glosses remain
      // usable if neither the database nor its saved snapshot is available.
      if (open) void initializeLanguageDatabase().then(() => refresh(n => n + 1), () => {})
    }} />
}

import WordHelp from '../learning/WordHelp'
import { speakEnglish } from '../learning/speech'
import type HotelWordHelp from '../hotel/HotelWordHelp'
import { padelWordExamples, padelWordGlosses, padelWordProfiles } from './wordData'
import '../hotel/word-help.css'

export default function PadelWordHelp({ question, onListen, onHelp, tokenOpacity }: Parameters<typeof HotelWordHelp>[0]) {
  return <WordHelp text={question.english} theme="padel" translations={padelWordGlosses} profiles={padelWordProfiles}
    examplesForWord={padelWordExamples} onHelp={onHelp} tokenOpacity={tokenOpacity}
    onListen={onListen ?? (() => speakEnglish(question.english,question.audioUrl))} />
}

import WordHelp from '../learning/WordHelp'
import { speakEnglish } from '../learning/speech'
import type HotelWordHelp from '../hotel/HotelWordHelp'
import { padelWordExamples, padelWordGlosses, padelWordProfiles } from './wordData'
import '../hotel/word-help.css'
import WordMeaningTile from '../fimo/WordMeaningTile'

export default function PadelWordHelp({ question, onListen, onHelp, tokenOpacity, clay = false }: Parameters<typeof HotelWordHelp>[0] & { clay?: boolean }) {
  return <WordHelp text={question.english} theme="padel" translations={padelWordGlosses} profiles={padelWordProfiles}
    examplesForWord={padelWordExamples} onHelp={onHelp} tokenOpacity={tokenOpacity}
    renderToken={clay ? (word, punctuation, followingText, precedingText) => <WordMeaningTile word={word} punctuation={punctuation} followingText={followingText} precedingText={precedingText}/> : undefined}
    onListen={onListen ?? (() => speakEnglish(question.english,question.audioUrl))} />
}

export function PadelSentenceHelp(props: Parameters<typeof HotelWordHelp>[0]) {
  return <PadelWordHelp {...props} clay />
}

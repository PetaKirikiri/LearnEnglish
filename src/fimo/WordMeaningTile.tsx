import { useId } from 'react'
import { iconForMeaning, wordMeaning } from './wordMeaning'
import MeaningIcon from './MeaningIcon'
import './word-meaning-tile.css'

export default function WordMeaningTile({ word, punctuation, followingText, precedingText = '' }: { word: string; punctuation: string; followingText: string; precedingText?: string }) {
  const id = useId().replaceAll(':', '')
  const meaning = wordMeaning(word, followingText, precedingText)
  const icon = meaning ? iconForMeaning(meaning) : undefined
  return <span className={`meaning-tile${meaning ? ' meaning-tile-illustrated' : ''}${word.length > 7 ? ' meaning-tile-long' : ''}`} data-meaning={meaning}>
    <span className="meaning-tile-face" aria-hidden="true">
      <svg viewBox="0 0 144 128" preserveAspectRatio="none" className="meaning-tile-body">
        <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop stopColor="white" stopOpacity=".3"/><stop offset=".5" stopColor="white" stopOpacity="0"/><stop offset="1" stopColor="#483d32" stopOpacity=".16"/></linearGradient></defs>
        <path fill="var(--tile-pigment)" d="M20 5H116Q130 5 130 19V47C148 44 148 82 130 79V109Q130 123 116 123H20Q6 123 6 109V79C24 82 24 44 6 47V19Q6 5 20 5Z"/>
        <path fill={`url(#${id})`} d="M20 5H116Q130 5 130 19V47C148 44 148 82 130 79V109Q130 123 116 123H20Q6 123 6 109V79C24 82 24 44 6 47V19Q6 5 20 5Z"/>
      </svg>
      {icon ? <MeaningIcon icon={icon}/> : null}
    </span>
    <span className="meaning-tile-word">{word}{punctuation}</span>
  </span>
}

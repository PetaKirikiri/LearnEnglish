import { NounModeIcon } from './NounModeToggle'
import './pronounIcon.css'

const portraits: Record<string, string> = {
  bia: '/classroom/icons/people/bia.png',
}

/** Named people share the same artwork on cards, pickers and explanations. */
export default function ProperNounIcon({ word }: { word: string }) {
  const portrait = portraits[word.trim().toLowerCase()]
  return portrait
    ? <span className="cw-person-icon cw-pronoun-icon" role="img" aria-label={word}><img src={portrait} alt="" draggable={false}/></span>
    : <span className="cw-subject-icon"><NounModeIcon mode="name"/></span>
}

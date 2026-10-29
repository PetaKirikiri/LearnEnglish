import { NounModeIcon } from './NounModeToggle'
import './pronounIcon.css'

const artwork: Record<string, string> = {
  i: 'i', me: 'i', you: 'you', he: 'he', she: 'she',
}

/** Shared gesture artwork for sentence cards, selectors and word explanations. */
export default function PronounIcon({ word }: { word: string }) {
  const asset = artwork[word.trim().toLowerCase()]
  return <span className="cw-person-icon cw-pronoun-icon" role="img" aria-label={word}>
    {asset
      ? <img src={`/classroom/icons/pronouns/${asset}.png`} alt="" draggable={false}/>
      : <NounModeIcon mode="pronoun"/>}
  </span>
}

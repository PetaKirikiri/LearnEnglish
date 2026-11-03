import { NounModeIcon } from './NounModeToggle'
import './pronounIcon.css'

const artwork: Record<string, string> = {
  i: 'i', me: 'i', you: 'you', he: 'he', him: 'he', she: 'she', her: 'she',
  we: 'we', us: 'we', they: 'they', them: 'they',
}

/** Person-reference artwork is separate from apple-bearing possessive determiner artwork. */
export default function PronounIcon({ word }: { word: string }) {
  const asset = artwork[word.trim().toLowerCase()]
  return <span className="cw-person-icon cw-pronoun-icon" role="img" aria-label={word}>
    {asset
      ? <img src={`/classroom/icons/pronouns/${asset}.png`} alt="" draggable={false}/>
      : <NounModeIcon mode={word.trim().toLowerCase()==='it'?'noun':'pronoun'}/>}
  </span>
}

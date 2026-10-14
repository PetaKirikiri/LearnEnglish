import { useEffect, useState } from 'react'
import { questions } from './course'
import { coachTopics } from './content'
import { englishMeaning } from './englishReview'
import Icon from '../ui/Icon'
import { speakEnglish as playRecording, stopEnglishSpeech as stopRecording } from '../learning/speech'

export default function CoachContent() {
  const [error, setError] = useState(false)
  useEffect(() => () => stopRecording(), [])
  return <section className="hotel-content" lang="fr">
    <h1>Contenu <span>{questions.length}</span></h1>
    {error ? <p role="alert">Audio indisponible. Réessayez.</p> : null}
    <div className="hotel-content-scroll" tabIndex={0} role="region" aria-label="Contenu du cours">
      <table><thead><tr><th>#</th><th>Objectif</th><th>Thaï</th><th lang="en">English</th><th>Français</th><th>Autre choix</th></tr></thead>
        <tbody>{questions.map((q, i) => <tr key={q.id}><td>{i + 1}</td><td>{coachTopics.find(([id]) => id === q.skill)?.[1]}</td>
          <td><button className="coach-table-audio" aria-label={`Écouter la phrase ${i + 1}`} onClick={() => playRecording(q.thai, q.audioUrl, state => setError(state === 'blocked'))}><Icon name="sound" /></button><span lang="th">{q.thai}</span></td>
          <td lang="en">{englishMeaning(q.id, q.correct)}</td><td>{q.choices[q.correct]}</td><td>{q.choices[1 - q.correct]}</td></tr>)}</tbody></table>
    </div>
  </section>
}

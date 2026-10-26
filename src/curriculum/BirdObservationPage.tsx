import { useState } from 'react'
import type { Curriculum } from './schema'
import { levels } from './schema'
import ExampleLanguage from '../learning/ExampleLanguage'
import {glossBirdSentence} from './birdGlosses'
import {visibleBirdPatterns} from './birdPatternFamilies'
import BirdScene from './BirdScene'
import {artworkForBird} from './birdArtwork'

export default function BirdObservationPage({data}:{data:Curriculum}) {
  const [level,setLevel]=useState('All')
  const groups=visibleBirdPatterns(data,level)
  return <section className="hotel-content curriculum bird-structures">
    <div className="curriculum-toolbar"><label>Level <select value={level} onChange={event=>setLevel(event.target.value)}>
      <option>All</option>{levels.filter(l=>data.skills.some(s=>s.level===l)).map(l=><option key={l}>{l}</option>)}
    </select></label></div>
    <div className="bird-comparisons">{groups.map(group=><section className="bird-comparison" key={group.id} aria-labelledby={`bird-${group.id}`}>
      <h2 id={`bird-${group.id}`}><span className="bird-number">{group.number}.</span> {group.title}</h2>
      <div>{group.dialogues.map(dialogue=><div className="bird-sentence bird-dialogue" key={dialogue.key} role="group" aria-label={dialogue.meaning}>
        {(['question','answer'] as const).map(role=><div className={`bird-turn bird-${role}`} key={role}>
          <div className="bird-visual">
            <BirdScene scene={artworkForBird(dialogue.nodeId,dialogue.meaning)[role]}/>
          </div>
          <div className="bird-message">
          <img className="bird-speaker" src={role==='question'?'/images/fimo/success-wolf-grey-clay.png':'/images/fimo/thumbs/word-person.png'} alt={role==='question'?'Teacher wolf asking':'Answering'} width="48" height="48" loading="lazy"/>
          <div className="bird-bubble">
            <div className="bird-bubble-copy">
            <ExampleLanguage english={dialogue[role].english} thai={dialogue[role].thai} units={glossBirdSentence(dialogue[role].english)}/>
            </div>
          </div>
          </div>
        </div>)}
      </div>)}</div>
    </section>)}</div>
  </section>
}

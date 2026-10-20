import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { wordIcons, type WordIcon } from './wordIconCatalogue'
import { contextualIcons } from './wordMeaning'
import MeaningIcon from './MeaningIcon'
import './word-meaning-tile.css'
import './word-icon-review.css'

export default function WordIconReview() {
  const [search, setSearch] = useState('')
  const artwork = new URLSearchParams(window.location.search).has('artwork')
  const catalogue = { ...wordIcons, ...contextualIcons }
  const assets = [...new Set(Object.values(catalogue).flatMap(icon=>[icon.asset,icon.secondary]).filter((asset):asset is string=>!!asset))]
  const source: [string,WordIcon][] = artwork ? assets.map(asset=>[asset,{asset,description:asset}]) : Object.entries(catalogue)
  const entries = source.filter(([word]) => word.includes(search.toLowerCase())).sort(([a],[b]) => a.localeCompare(b))
  return <main className={`word-icon-review${artwork ? ' artwork-only' : ''}`}><header><a href="/padel/preview">← Padel</a><input type="search" aria-label="Find word" placeholder="Find word" value={search} onChange={event=>setSearch(event.target.value)}/><span>{artwork ? `${assets.length} images` : `${Object.keys(wordIcons).length} words`}</span></header><div className="word-icon-review-grid">{entries.map(([word,icon])=><figure key={word} data-word={word}><div className="word-icon-review-art"><MeaningIcon icon={icon}/></div><figcaption>{word}</figcaption>{artwork ? null : <p>{icon.description}</p>}</figure>)}</div></main>
}

// Local design QA only; Vite's production entry remains index.html.
if (import.meta.env.DEV) createRoot(document.getElementById('root')!).render(<WordIconReview/> )

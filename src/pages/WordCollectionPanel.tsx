import { useState } from 'react'
import Icon from '../ui/Icon'
import { WORDS_PER_LEVEL, type CollectionStatus, type WordCollection } from '../learning/wordCollection'
import { RANKED_RARITIES, RARITY_DESCRIPTIONS, type WordRarity } from '../learning/wordRarity'

const sections: { label: string; value: CollectionStatus | 'All' }[] = [
  { label: 'All words', value: 'All' }, { label: 'Collected', value: 'Conquered' },
  { label: 'Discovering', value: 'Practising' }, { label: 'Undiscovered', value: 'Yet to see' },
]
function RankEmblem({ tier }: { tier: WordRarity }) {
  if (tier === 'Foundation') return <Icon name="book" className="foundation-emblem" />
  const index = RANKED_RARITIES.indexOf(tier)
  return <span className="rank-emblem" aria-hidden="true" style={{ backgroundPosition: `${index % 4 * 100 / 3}% ${index < 4 ? 0 : 100}%` }} />
}

export default function WordCollectionPanel({ collection }: { collection: WordCollection }) {
  const [filter, setFilter] = useState<CollectionStatus | 'All'>('All')
  const [rarity, setRarity] = useState<WordRarity | null>(null)
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(24)
  const words = collection.words.filter(w => (filter === 'All' || w.status === filter) && (!rarity || w.rarity === rarity) && w.word.includes(search.trim().toLowerCase()))
  const levelProgress = WORDS_PER_LEVEL - collection.toNextLevel
  const foundations = collection.words.filter(w => w.rarity === 'Foundation')
  const foundationsEarned = foundations.filter(w => w.status === 'Conquered').length
  return (
    <section aria-label="Word collection" className="word-vault">
      <header className="vault-hero">
        <div><h2>Your collection</h2><p className="vault-total"><strong>{collection.conquered}</strong> {collection.conquered === 1 ? 'word' : 'words'} collected <span>/ {collection.catalogueTotal.toLocaleString()}</span></p></div>
        <div className="vault-level"><div><p>{collection.toNextLevel} words to Level {collection.level + 1}</p><div className="vault-track" role="progressbar" aria-label="Words toward next level" aria-valuemin={0} aria-valuemax={WORDS_PER_LEVEL} aria-valuenow={levelProgress}><span style={{width:`${levelProgress / WORDS_PER_LEVEL * 100}%`}} /></div></div></div>
      </header>
      <button type="button" className="foundation-button rarity-foundation" aria-pressed={rarity === 'Foundation'} onClick={() => { setRarity(rarity === 'Foundation' ? null : 'Foundation'); setLimit(24) }}>
        <RankEmblem tier="Foundation" /><span><strong>Foundation</strong><span>Everyday building blocks</span></span><span className="foundation-count">{foundationsEarned} <i>/ {collection.tierTotals.Foundation}</i></span>
      </button>
      <div className="vault-tiers" aria-label="Rarity tiers">{RANKED_RARITIES.map(tier => {
        const tierWords = collection.words.filter(w => w.rarity === tier)
        const earned = tierWords.filter(w => w.status === 'Conquered').length
        const total = collection.tierTotals[tier]
        return <button key={tier} type="button" className={`tier-button rarity-${tier.toLowerCase()}`} aria-pressed={rarity === tier} onClick={() => { setRarity(rarity === tier ? null : tier); setLimit(24) }}><span className="tier-art"><RankEmblem tier={tier} /></span><strong>{tier}</strong><span className="tier-count">{total ? <>{earned} <i>/ {total}</i></> : <i>Coming later</i>}</span>{total > 0 ? <span className="tier-track"><span style={{width:`${earned / total * 100}%`}} /></span> : <span className="tier-seal" aria-hidden="true" />}</button>
      })}</div>
      <div className="vault-body">
        <div className="vault-toolbar"><div className="vault-tabs" aria-label="Collection categories">{sections.map(({label,value}) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => {setFilter(value);setLimit(24)}}>{label}<span>{collection.words.filter(w => (!rarity || w.rarity === rarity) && (value === 'All' || w.status === value)).length}</span></button>)}</div><input className="vault-search" aria-label="Find a collection word" placeholder="Find a word…" value={search} onChange={e => {setSearch(e.target.value);setLimit(24)}} /></div>
        <div className="vault-section-title"><h3>{rarity ? `${rarity} collection` : 'All rarities'} <span>{words.length}</span></h3>{rarity ? <button onClick={() => {setRarity(null);setLimit(24)}}>Clear tier ×</button> : <span>LESSON WORDS FIRST</span>}</div>
        {rarity && <p className="vault-tier-description">{RARITY_DESCRIPTIONS[rarity]}</p>}
        <ul className="vault-grid">{words.slice(0,limit).map(w => <li key={w.word} className={`word-card rarity-${w.rarity?.toLowerCase() ?? 'unranked'} word-${w.status === 'Conquered' ? 'collected' : w.status === 'Practising' ? 'discovered' : 'unseen'}`} aria-label={`${w.word}: ${w.rarity ?? 'Unranked'}, ${w.status}`}>
          <div className="word-card-top"><span>{w.rarity && <RankEmblem tier={w.rarity} />} {w.rarity ?? 'Unranked'}</span>{w.status === 'Conquered' && <Icon name="check" className="word-collected-mark" />}</div>
          <h4>{w.word}</h4>
          <div className="word-card-bottom"><span>{w.status === 'Conquered' ? 'Collected' : w.status === 'Practising' ? 'Discovering' : w.available ? 'Undiscovered' : 'Not in lessons yet'}</span>{w.needsReview && <small>Review</small>}</div>
        </li>)}</ul>
        {!words.length && <p className="vault-empty">{rarity && !collection.words.some(w => w.rarity === rarity) ? `${rarity} challenges are coming later. This tier is reserved for ${RARITY_DESCRIPTIONS[rarity].toLowerCase()}.` : search ? 'No words match your search.' : filter === 'Conquered' ? 'This part of your collection is waiting to be earned.' : 'No words here yet. Explore another tier.'}</p>}
        {words.length > limit && <button className="vault-more" onClick={() => setLimit(n => n + 24)}>Show more ↓</button>}
        <details className="vault-guide"><summary>About your collection</summary><p>Each tier has a fixed word list. Its counter shows your collected words out of that full list, including words not in lessons yet. Adding lessons does not change the size of a tier. Available lesson words appear first, followed by the rest in alphabetical order.</p><p>Foundation holds everyday building blocks. The catalogue uses Oxford and Cambridge vocabulary benchmarks. Discover and collect words through repeated correct answers without help across multiple days. Every collected word counts toward your level, and earned words stay yours. Advanced tiers need their own reviewed word lists and usage challenges before they become available.</p></details>
      </div>
    </section>
  )
}

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { recogniseHomeworkAccount } from '../auth/homeworkLine'
import { advance, evaluate, extendsPhrase, newMatch, troops, words } from './engine'
import type { Card, Kind, Word } from './engine'
import './wordBattle.css'

type Attempt = { text: string; valid: boolean; at: number }
const initial: Word[] = ['the', 'dog', 'runs', 'a', 'cat', 'big', 'quickly']
export default function WordBattle() {
  const sequence = useRef(20)
  const [hand, setHand] = useState<Card[]>(initial.map((word, id) => ({ word, id })))
  const [play, setPlay] = useState<Card[]>([])
  const [bank, setBank] = useState<Card[][]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [energy, setEnergy] = useState(0)
  const [match, setMatch] = useState(newMatch)
  const [running, setRunning] = useState(false)
  const [practice, setPractice] = useState(false)
  const [lane, setLane] = useState(1)
  const [message, setMessage] = useState('')
  const [account, setAccount] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [saveError, setSaveError] = useState(false)
  const [help, setHelp] = useState(false)
  const [order, setOrder] = useState<number[]>([])
  const drag = useRef<{id:number;x:number;y:number} | null>(null)
  const suppressClick = useRef(false)
  const ended = match.tick >= 150 || match.you <= 0 || match.bot <= 0
  const leftover = hand.length + play.filter(card => editing === null || !bank[editing]?.some(old => old.id === card.id)).length
  const youFinal = Math.max(0, match.you - leftover)
  const verdict = evaluate(play.map(card => card.word))
  const previous = editing === null ? 0 : evaluate(bank[editing].map(card => card.word)).score
  const freshCards = play.length - (editing === null ? 0 : bank[editing].length)
  const burst = Math.max(0, freshCards - 2) * 2
  const earned = Math.max(0, verdict.score - previous) + burst
  useEffect(() => { let active = true; void supabase.auth.getSession().then(({ data }) => { if (active) setAccount(data.session?.user.id ?? null) }); const { data } = supabase.auth.onAuthStateChange((_event, session) => setAccount(session?.user.id ?? null)); return () => { active = false; data.subscription.unsubscribe() } }, [])
  useEffect(() => {
    if (/Line\//i.test(navigator.userAgent) || new URLSearchParams(location.search).has('liff.state')) {
      void recogniseHomeworkAccount().catch(() => setMessage('LINE sign-in failed. You can still play.'))
    }
  }, [])
  useEffect(() => {
    try { setAttempts(JSON.parse(localStorage.getItem(`word-battle:attempts:${account ?? 'guest'}`) ?? '[]')) } catch { setAttempts([]) }
  }, [account])
  function record(attempt: Attempt) {
    const next = [...attempts, attempt].slice(-100)
    setAttempts(next)
    try { localStorage.setItem(`word-battle:attempts:${account ?? 'guest'}`, JSON.stringify(next)); setSaveError(false) } catch { setSaveError(true) }
  }
  function draw() { setHand(cards => [...cards, { id: sequence.current++, word: words[Math.floor(Math.random() * words.length)] }]) }
  useEffect(() => {
    if (!running || ended || practice) return
    const timer = window.setInterval(() => setMatch(state => advance(state)), 1000)
    return () => window.clearInterval(timer)
  }, [running, ended, practice])
  useEffect(() => { if (match.tick > 0 && match.tick % 5 === 0) draw() }, [match.tick])
  function reset(isPractice = practice) {
    setRunning(false); setPractice(isPractice); setMatch(newMatch()); setEnergy(0); setPlay([]); setBank([]); setEditing(null)
    setHand(initial.map(word => ({ word, id: sequence.current++ })))
    setMessage('')
  }
  function cancel() {
    const originals = editing === null ? [] : bank[editing]
    setHand(cards => [...cards, ...play.filter(card => !originals.some(old => old.id === card.id))]); setPlay([]); setEditing(null)
  }
  function commit() {
    if (play.length === 0 || ended || (!running && !practice)) return
    const extension = editing === null || extendsPhrase(bank[editing].map(card => card.word), play.map(card => card.word))
    const valid = verdict.valid && extension
    record({ text: play.map(card => card.word).join(' '), valid, at: Date.now() })
    if (!valid) {
      if (!practice) setEnergy(value => value - 2)
      setMessage(practice ? 'Try again' : '−2 ⚡')
      cancel(); return
    }
    setEnergy(value => value + earned)
    setBank(rows => editing === null ? [...rows, play] : rows.map((row, i) => i === editing ? play : row))
    setMessage(`+${earned} ⚡${burst ? ` · +${burst} burst` : ''}`); setPlay([]); setEditing(null)
  }
  function deploy(kind: Kind) {
    if (energy < troops[kind].cost || !running || ended || practice) return
    setEnergy(value => value - troops[kind].cost)
    setMatch(state => ({ ...state, nextId: state.nextId + 1, units: [...state.units, { id: state.nextId, kind, side: 'you', lane, x: 6, hp: 8 }] }))
  }
  const pool = [...play, ...hand].sort((a,b) => {
    const rank = (card: Card) => order.includes(card.id) ? order.indexOf(card.id) : 10000 + card.id
    return rank(a) - rank(b)
  })
  function moveCard(from: number, to: number) {
    const ids = pool.map(card => card.id)
    const source = ids.indexOf(from), target = ids.indexOf(to)
    if (source < 0 || target < 0 || source === target) return
    ids.splice(source,1); ids.splice(target,0,from); setOrder(ids)
    setPlay(cards => [...cards].sort((a,b) => ids.indexOf(a.id)-ids.indexOf(b.id)))
  }
  const weak = [...new Set(attempts.filter(attempt => !attempt.valid).map(attempt => attempt.text))].slice(-4)
  return <main className="wb">
    <section className="wb-arena" aria-label="Battlefield">
      {[0, 1, 2].map(index => <button key={index} className={`wb-lane ${lane === index ? 'selected' : ''}`} onClick={() => setLane(index)} aria-label={`Deploy in lane ${index + 1}`} aria-pressed={lane === index}><span className="wb-path"/>{match.units.filter(unit => unit.lane === index).map(unit => <span key={unit.id} className={`wb-unit ${unit.side}`} style={{ left: `${unit.x}%` }}>{troops[unit.kind].icon}<small>{unit.hp}</small></span>)}</button>)}
      {!running && !practice && !ended && <div className="wb-overlay"><button className="wb-primary" onClick={() => setRunning(true)}>Start battle →</button></div>}
      {ended && <div className="wb-overlay"><h2>{youFinal > match.bot ? 'Victory!' : youFinal === match.bot ? 'Draw!' : 'Enemy wins'}</h2><p>Your base {match.you} − {leftover} leftover cards = {youFinal}<br/>Enemy base: {match.bot}</p><button className="wb-primary" onClick={() => reset()}>Play again</button></div>}
      <div className="wb-battlebar"><span>🏰 {match.you}</span><b>⚡ {energy}</b><span>{practice ? '∞' : `${Math.floor((150-match.tick)/60)}:${String((150-match.tick)%60).padStart(2,'0')}`}</span><span>{match.bot} 🏯</span><button aria-label="Rules" onClick={()=>setHelp(value=>!value)}>?</button><button onClick={()=>reset(!practice)}>{practice ? 'Battle' : 'Practice'}</button></div>
    </section>
    <div className="wb-shop">{(Object.keys(troops) as Kind[]).map(kind => <button key={kind} disabled={energy < 6 || !running || ended || practice} onClick={() => deploy(kind)}><span>{troops[kind].icon}</span><div><b>{troops[kind].name}</b><small>› {troops[troops[kind].beats].icon}</small></div><strong>6 ⚡</strong></button>)}</div>
    <div className="wb-workspace"><section className="wb-panel wb-cards">
      <div className="wb-hand">{pool.map(card => {
        const selected = play.findIndex(item=>item.id===card.id)
        const original = editing !== null && bank[editing].some(item=>item.id===card.id)
        return <button key={card.id} data-card-id={card.id} className={selected>=0 ? 'chosen' : ''} aria-pressed={selected>=0} disabled={ended}
          onPointerDown={event=>{drag.current={id:card.id,x:event.clientX,y:event.clientY};suppressClick.current=false;event.currentTarget.setPointerCapture(event.pointerId)}}
          onPointerUp={event=>{const source=drag.current;drag.current=null;if(source && Math.hypot(event.clientX-source.x,event.clientY-source.y)>12){suppressClick.current=true;const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-card-id]');if(target)moveCard(source.id,Number(target.getAttribute('data-card-id')))}}}
          onClick={()=>{if(suppressClick.current){suppressClick.current=false;return}if(selected>=0){if(original)return;setPlay(cards=>cards.filter(item=>item.id!==card.id));setHand(cards=>[...cards,card])}else{setPlay(cards=>[...cards,card]);setHand(cards=>cards.filter(item=>item.id!==card.id))}}}>
          {card.word}{selected>=0 && <sup>{selected+1}</sup>}
        </button>
      })}</div><button className="wb-primary wb-commit" onClick={commit} disabled={!play.length || ended || (!running && !practice)}>Commit</button>{practice && <button onClick={draw} aria-label="Draw a word">＋</button>}
      {message && <p className="wb-message" role="status">{message}</p>}
      {editing!==null && <button className="wb-cancel" onClick={cancel}>×</button>}
    </section><section className="wb-panel wb-table">
      <div className="wb-bank">{bank.map((row, index) => <button key={index} disabled={play.length > 0 || ended} onClick={() => { setEditing(index); setPlay(row) }}><span>{row.map(card => card.word).join(' ')}</span><b>{evaluate(row.map(card => card.word)).score} ⚡</b></button>)}</div>
      {help && <details open><summary onClick={event => {event.preventDefault();setHelp(false)}}>Close rules ×</summary><p>Unused cards cost 1 base HP each when the round ends. Invalid plays cost 2 energy.</p><p>Phrase score = words × words. Complete sentence = +6. Extensions pay the difference. “the dog” = 4; “the big dog runs” = 22. A drop of 3+ new cards earns +2 per card beyond the first two. Holding earns a bigger burst; banking early lets you deploy sooner.</p><p>Tap a lane before deploying. Guards beat riders, riders beat archers, archers beat guards. The enemy sends one unit every 18 seconds.</p><p>Words: {words.join(', ')}. This small deck uses a/the + optional adjective + noun, runs/sleeps + optional adverb, and eats + noun phrase.</p></details>}
      {practice && weak.length > 0 && <div className="wb-practice"><h3>Try these again</h3>{weak.map(text => <p key={text}>{text}</p>)}{!practice && <button onClick={() => reset(true)}>Practise without the clock →</button>}</div>}{saveError && <p role="alert">Your practice history could not be saved. Check browser storage.</p>}
    </section></div>

  </main>
}

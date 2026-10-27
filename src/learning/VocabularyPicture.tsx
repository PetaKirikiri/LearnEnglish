import { pluralVocabulary, pairVocabulary } from '../race/pluralVocabulary'
import { tonightWords } from '../race/tonightVocabulary'
import type { ReactNode } from 'react'
import './vocabularyPicture.css'

// Concrete lesson nouns only: book means a physical book here, never a booking.
const drawings: Record<string, ReactNode> = {
  shoe: <><path fill="#789aab" d="M9 37l5-17 12 5 5 13 23 7q5 2 4 10H7q-2-10 2-18Z"/><path fill="#f7f0df" d="M8 48h49v8H7Z"/><path d="m25 32 10-2m-6 8 10-2m-6 8 10-2" stroke="#f7f0df"/></>,
  key: <><circle cx="21" cy="21" r="13" fill="#d6b16c"/><circle cx="21" cy="21" r="5" fill="#fff9ef"/><path fill="#d6b16c" d="m29 30 24 24 6-6-6-6-5 4-5-5 4-5-12-12Z"/></>,
  sock: <><path fill="#f4ead3" d="M28 8h22v30q1 8-7 13L23 60q-11 2-15-6-3-7 4-12l16-9Z"/><path fill="#82a493" d="M28 8h22v9H28ZM11 43q-8 8 0 14 5 5 13 1l-6-16ZM39 34h11v8l-8 7-6-8Z"/></>,
  bag: <><path d="M23 26v-9q9-10 18 0v9" fill="none"/><rect x="7" y="24" width="50" height="32" rx="10" fill="#b78a60"/><path d="M20 25v30m24-30v30M27 33h10"/><path d="m8 31-4 4m52-4 4 4"/></>,
  ticket: <><path fill="#e6c37d" d="M7 17h50v10q-9 5 0 10v10H7V37q9-5 0-10Z"/><path d="M43 19v26" strokeDasharray="3 4"/><path d="M19 25h16m-16 8h12m-12 7h16"/></>,
  book: <><path fill="#eee5d1" d="M12 10h40v47H16q-6 0-6-6V15Z"/><path fill="#789b8b" d="M12 7h40v42H17q-7 0-7 6V13q0-6 2-6Z"/><path d="M18 8v40M23 20h21m-21 7h15M17 54h33" stroke="#f8f0df"/><path fill="#cba564" d="M36 7h8v26l-4-4-4 4Z"/></>,
  sandal: <><path fill="#d7b57c" d="M25 5q15-4 19 12l8 26q4 14-10 17-12 3-16-9L16 21Q12 8 25 5Z"/><path d="m20 21 17 9 8-16M37 30l6 23" stroke="#688e87" strokeWidth="7"/><path d="m25 8 4 10" stroke="#688e87" strokeWidth="5"/></>,
  boot: <><path fill="#ae8465" d="M14 7h25v28l17 9q5 3 3 12H9V39l5-4Z"/><path fill="#e5d4ac" d="M13 7h27v9H13Z"/><path fill="#6a6b5d" d="M9 50h50v7H9Z"/><path d="M32 20v19m-8-15h13m-13 8h13"/></>,
  shirt: <><path fill="#80a29c" d="m23 9-14 7-7 15 12 6 5-8v29h26V29l5 8 12-6-7-15-14-7Z"/><path fill="#f6efdc" d="m23 9 9 8 9-8-4 15-5-7-5 7Z"/><path d="M32 18v39M39 28h5v9h-5"/><circle cx="35" cy="30" r="1"/><circle cx="35" cy="40" r="1"/><circle cx="35" cy="50" r="1"/></>,
  hat: <><ellipse cx="32" cy="45" rx="28" ry="11" fill="#d6b577"/><path fill="#d6b577" d="m17 40 4-23q11-8 22 0l4 23q-15 7-30 0Z"/><path fill="#758f80" d="m18 32 28 0 1 8q-15 7-30 0Z"/></>,
  pen: <g transform="rotate(35 32 32)"><rect x="26" y="6" width="12" height="42" rx="4" fill="#6b8ea6"/><path fill="#d5b370" d="m26 48 6 12 6-12Z"/><path d="M29 10v17m12-15v16" stroke="#f6f0de"/><path d="M32 57v4"/></g>,
  pencil: <g transform="rotate(35 32 32)"><path fill="#e5bd69" d="M26 15h12v33H26Z"/><path fill="#dbad9e" d="M26 7q6-5 12 0v8H26Z"/><path fill="#f3dfb8" d="m26 48 6 13 6-13Z"/><path d="M32 18v29M26 15h12M31 58l1 3 1-3"/></g>,
  phone: <><rect x="17" y="4" width="30" height="56" rx="7" fill="#5f7e86"/><rect x="21" y="11" width="22" height="38" rx="2" fill="#c3dce2"/><path d="m25 35 13-14m-11 21 10-12" stroke="#eef7f6"/><path d="M29 7h6M29 55h6" stroke="#e7dfcb"/></>,
  charger: <><path d="M21 15V6m11 9V6" strokeWidth="4"/><rect x="12" y="15" width="29" height="23" rx="6" fill="#e4d8be"/><path d="M26 38v9q0 12 16 10 12-1 12-13v-8" fill="none"/><rect x="48" y="25" width="12" height="13" rx="3" fill="#829e96"/><path d="M51 25v-5h6v5" fill="#c6d5d3"/></>,
  towel: <><rect x="8" y="18" width="47" height="35" rx="7" fill="#ede2c8"/><path fill="#f7efdc" d="M8 18q0-8 8-8h37v37H16q-8 0-8-8Z"/><path d="M16 43h37M16 48h37" stroke="#80a299"/><path d="M16 10v32" stroke="#d7c6a5"/></>,
  bottle: <><rect x="24" y="5" width="16" height="9" rx="3" fill="#dbc68e"/><path fill="#7ea49b" d="M24 14v7q-9 4-9 12v20q0 8 8 8h18q8 0 8-8V33q0-8-9-12v-7Z"/><rect x="16" y="32" width="32" height="16" rx="2" fill="#e6ead8"/><path d="M23 25v4" stroke="#f2f2dd"/></>,
  cup: <><path d="M45 21h7q12 13-1 21h-7" fill="none" strokeWidth="5"/><path fill="#82a6b1" d="M10 16h36v28q0 12-18 12T10 44Z"/><ellipse cx="28" cy="16" rx="18" ry="6" fill="#e3eee9"/><ellipse cx="28" cy="17" rx="13" ry="3" fill="#a6886a"/></>,
  plate: <><ellipse cx="32" cy="34" rx="28" ry="23" fill="#a4babb"/><ellipse cx="32" cy="32" rx="28" ry="23" fill="#e9efe5"/><ellipse cx="32" cy="32" rx="20" ry="16" fill="#c6d9d5"/><path d="M15 24q8-12 23-8" stroke="#fffaf0" fill="none"/></>,
  glasses: <><path d="m7 27-3-13m53 13 3-13M27 31q5-6 10 0" fill="none"/><rect x="5" y="25" width="23" height="19" rx="8" fill="#d5e9eb" strokeWidth="4"/><rect x="36" y="25" width="23" height="19" rx="8" fill="#d5e9eb" strokeWidth="4"/><path d="m11 37 8-7m23 7 8-7" stroke="#fff"/></>,
  trousers: <><path fill="#7c93aa" d="M16 6h32l6 53H37l-5-30-5 30H10Z"/><path d="M16 14h32M32 7v15m-15-5 8 8m22-8-8 8"/><circle cx="34" cy="10" r="1" fill="#dcb572"/></>,
  shop: <><rect x="9" y="23" width="46" height="35" rx="2" fill="#e9d4ad"/><path fill="#82a397" d="M7 9h50l5 16H2Z"/><path d="m17 9-3 16M29 9l-1 16M40 9l3 16M51 9l6 16" stroke="#f7ead2" strokeWidth="6"/><rect x="34" y="32" width="13" height="26" fill="#85a5af"/><rect x="15" y="32" width="13" height="15" fill="#c5dedf"/></>,
}
const pluralForms: Record<string, string> = { shoes:'shoe', keys:'key', socks:'sock', bags:'bag', tickets:'ticket', books:'book', sandals:'sandal', boots:'boot', shirts:'shirt', hats:'hat', pens:'pen', pencils:'pencil', phones:'phone', chargers:'charger', towels:'towel', bottles:'bottle', cups:'cup', plates:'plate', shops:'shop' }
export default function VocabularyPicture({ word, count }: { word: string; count?: number }) {
  const normalized = word.toLowerCase().replace(/[?!.,]/g, '').trim()
  const name = pluralForms[normalized] ?? normalized
  const levelOne = tonightWords.some(([word]) => word === name)
  const levelTwo = pluralVocabulary.some(item => item.singular === name) || pairVocabulary.some(item => item.plural === name)
  const copies = count ?? (pluralForms[normalized] ? 2 : 1)
  if (levelOne || levelTwo) return <span className="vocabulary-picture vocabulary-picture-art" data-word={name} aria-hidden="true">{Array.from({length:copies}, (_,index) => <img key={index} src={`/classroom/icons/${levelOne ? 'level-one' : 'level-two'}/${name.replaceAll(' ', '-')}.png`} alt=""/>)}</span>
  if (!drawings[name]) return null
  return <span className="vocabulary-picture" data-word={name} aria-hidden="true">{Array.from({length:copies}, (_,index) => <svg key={index} viewBox="0 0 64 64" fill="none" stroke="#4b625e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{drawings[name]}</svg>)}</span>
}

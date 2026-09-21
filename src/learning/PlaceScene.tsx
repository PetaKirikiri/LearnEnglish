import { useId } from 'react'
import type { PlaceRelation } from './examPracticeContent'

// A closed, solid box and a separate ball make the tested position visible.
// Depth is shown by overlap: the rear ball is painted before the opaque box.
export default function PlaceScene({ relation, object = 'ball', mirror = false }: { relation: PlaceRelation; object?: 'ball' | 'apple' | 'book' | 'cube'; mirror?: boolean }) {
  const id = useId().replaceAll(':', '')
  const descriptions: Record<PlaceRelation, string> = {
    under: 'ลูกบอลอยู่ใต้กล่องที่ยกสูง', behind: 'กล่องบังลูกบอลที่อยู่ด้านหลัง',
    'in front of': 'ลูกบอลอยู่บนพื้นด้านหน้ากล่องและบังส่วนล่างของกล่อง',
    between: 'ลูกบอลอยู่ตรงกลางระหว่างกล่องสองใบ', beside: 'ลูกบอลอยู่ข้างกล่อง',
    above: 'ลูกบอลอยู่สูงกว่ากล่องโดยมีช่องว่าง', on: 'ลูกบอลวางสัมผัสบนกล่อง',
    in: 'ลูกบอลอยู่ภายในกล่องที่เปิดให้เห็นข้างใน',
    over: 'ลูกศรแสดงลูกบอลเคลื่อนข้ามด้านบนกล่องจากซ้ายไปขวา',
    'next to': 'ลูกบอลอยู่ติดกับด้านข้างกล่อง',
  }
  const ball = (x: number, y: number, r = 18) => <g data-object={object}>{object === 'book' ? <><rect x={x-r} y={y-r} width={r*2} height={r*2} rx="3" fill="#e9ce91" stroke="#fff0c9"/><path d={`M${x-r+5} ${y-r}v${r*2} M${x-r+9} ${y+r-5}h${r}`} stroke="#80603c"/></> : object === 'cube' ? <rect x={x-r} y={y-r} width={r*2} height={r*2} rx="2" fill="#e9ce91" stroke="#fff0c9"/> : <><circle cx={x} cy={y} r={r} fill={`url(#${id}-ball)`} stroke="#f4dfad" strokeWidth="1.5"/><path d={`M ${x-r*.55} ${y-r*.2} Q ${x} ${y-r*.8} ${x+r*.45} ${y-r*.4}`} fill="none" stroke="#fff1cd" strokeWidth="2" opacity=".65"/>{object === 'apple' && <path d={`M${x} ${y-r+2}q0 -12 8 -12 M${x+1} ${y-r}q-14 -12 -17 -3q8 7 17 3`} fill="#8ea777" stroke="#b5c898"/>}</>}</g>
  const box = (x = 130, y = 65, w = 90, h = 64) => <g data-object="box" stroke="#8bacc8" strokeWidth="1.5" strokeLinejoin="round"><path d={`M${x} ${y} l20 -17 h${w} l-20 17 Z`} fill="#54728e"/><path d={`M${x+w} ${y} l20 -17 v${h} l-20 17 Z`} fill="#253d55"/><rect x={x} y={y} width={w} height={h} rx="2" fill="#365671"/><path d={`M${x+w/2} ${y} v${h}`} stroke="#7591aa" opacity=".5"/></g>
  return <svg viewBox="0 0 360 156" role="img" aria-label={descriptions[relation].replaceAll('ลูกบอล', object==='ball'?'ลูกบอล':object==='apple'?'แอปเปิล':object==='book'?'หนังสือ':'ลูกบาศก์เล็ก')} lang="th" style={{ display:'block', width:'100%', height:'clamp(110px, 18vh, 156px)', margin:'12px auto 0' }}>
    <defs><radialGradient id={`${id}-ball`} cx="30%" cy="25%"><stop stopColor="#fff0bc"/><stop offset=".6" stopColor="#dfbc6d"/><stop offset="1" stopColor="#a87735"/></radialGradient><marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10" fill="none" stroke="#e8cd91" strokeWidth="2"/></marker></defs>
    <g transform={mirror ? "translate(360 0) scale(-1 1)" : undefined}><path d="M48 139 H312" stroke="#8bacc8" opacity=".2"/>
    {relation === 'behind' && <>{ball(227,103)}{box()}<circle cx="227" cy="103" r="18" fill="none" stroke="#e8cd91" strokeWidth="1.5" strokeDasharray="3 4" opacity=".55"/></>}
    {relation === 'in front of' && <>{box()}{ball(172,128)}</>}
    {relation === 'under' && <>{box(130,29,90,42)}<path d="M135 72V138 M215 72V138" stroke="#54728e" strokeWidth="3"/>{ball(175,120)}</>}
    {relation === 'on' && <>{box()}{ball(181,40)}</>}
    {relation === 'above' && <>{box(130,94,90,40)}{ball(181,24)}</>}
    {(relation === 'beside' || relation === 'next to') && <>{box(100,65)}{ball(258,120)}</>}
    {relation === 'between' && <>{box(65,80,60,54)}{box(225,80,60,54)}{ball(181,120)}</>}
    {relation === 'in' && <><path d="M130 75 l20 -25 h90 l-20 25 Z" fill="#172b40" stroke="#8bacc8" strokeWidth="1.5"/><path d="M150 50v68h90V50" fill="#253d55" stroke="#8bacc8" strokeWidth="1.5"/>{ball(182,73)}<path d="M130 75v60h90V75 M220 135l20 -17V50l-20 25" fill="#365671" stroke="#8bacc8" strokeWidth="1.5"/><path d="M130 75h90" stroke="#a4c1d8" strokeWidth="2"/></>}
    {relation === 'over' && <>{box(135,89,80,46)}<path d="M67 120 C85 -8 266 -8 292 120" fill="none" stroke="#e8cd91" strokeWidth="2.5" strokeDasharray="5 5" markerEnd={`url(#${id}-arrow)`}/>{ball(180,25)}</>}
    </g>
  </svg>
}

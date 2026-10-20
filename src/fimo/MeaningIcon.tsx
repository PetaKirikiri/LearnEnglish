import { useId } from 'react'
import type { IconCue, WordIcon } from './wordIconCatalogue'

const strokes = { fill: 'none', stroke: '#4c726b', strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
function Person({ x = 50, y = 48, size = 1, color = 'currentColor' }: { x?: number; y?: number; size?: number; color?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`} fill={color}><circle cy="-15" r="12"/><path d="M-21 25V13Q-21-1 0-1T21 13V25Q0 33-21 25"/></g>
}
function Arrow({ direction = 'right' }: { direction?: string }) {
  const rotation = ({ left:180, up:270, down:90, diagonal:315, from:0, to:0 } as Record<string,number>)[direction] ?? 0
  if (direction === 'exchange' || direction === 'turn') return <g {...strokes}><path d="M20 35H78L65 22M80 65H22L35 78"/></g>
  return <g transform={`rotate(${rotation} 50 50)`} {...strokes}><path d="M18 50H80L62 32M80 50L62 68"/>{direction === 'from' ? <circle cx="18" cy="50" r="7" fill="#d0ad72" stroke="none"/> : null}{direction === 'to' ? <path d="M88 25V75" stroke="#d0ad72"/> : null}</g>
}
function Cue({ cue }: { cue: IconCue }) {
  const marks: Partial<Record<IconCue,string>> = {
    yes:'M26 50L43 67L76 31', complete:'M26 50L43 67L76 31', no:'M28 28L72 72M72 28L28 72',
    add:'M50 24V76M24 50H76',remove:'M24 50H76',left:'M75 50H25L43 32M25 50L43 68',right:'M25 50H75L57 32M75 50L57 68',
    up:'M50 75V25L32 43M50 25L68 43', down:'M50 25V75L32 57M50 75L68 57',
    return:'M73 70V48Q73 30 54 30H24L39 15M24 30L39 45',exchange:'M20 35H78L65 22M80 65H22L35 78',
    sparkle:'M50 16L60 40L84 50L60 60L50 84L40 60L16 50L40 40Z',
  }
  return <svg className="meaning-icon-cue" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#fff8e9" stroke="#d4c4a5" strokeWidth="4"/>
    {marks[cue] ? <path d={marks[cue]} {...strokes}/> : null}
    {cue === 'question' ? <text x="50" y="75" textAnchor="middle" fill="#78678c" fontSize="75" fontWeight="800">?</text> : null}
    {cue === 'warning' ? <><path d="M50 14L88 82H12Z" fill="#d9a06c"/><path d="M50 36V56M50 68V69" {...strokes}/></> : null}
    {cue === 'ongoing' ? <g fill="#6e9b8f"><circle cx="25" cy="50" r="8"/><circle cx="50" cy="50" r="8"/><circle cx="75" cy="50" r="8"/></g> : null}
    {cue === 'plural' || cue === 'group' ? <><Person x={34} size={.62}/><Person x={65} size={.62} color="#bc9a61"/></> : null}
    {cue === 'private' ? <><rect x="26" y="43" width="48" height="37" rx="8" fill="#6e9b8f"/><path d="M35 43V30Q50 10 65 30V43" {...strokes}/></> : null}
    {cue === 'pause' ? <path d="M35 24V76M65 24V76" {...strokes} strokeWidth="13"/> : null}
    {cue === 'start' ? <path d="M35 20L80 50L35 80Z" fill="#6e9b8f"/> : null}
    {cue === 'stop' ? <rect x="25" y="25" width="50" height="50" rx="7" fill="#b88170"/> : null}
    {cue === 'search' ? <g {...strokes}><circle cx="43" cy="43" r="22"/><path d="M60 60L80 80"/></g> : null}
    {cue === 'heart' ? <path d="M50 80Q-1 48 22 26Q40 12 50 32Q65 10 82 29Q101 50 50 80" fill="#bb857b"/> : null}
    {['clock','past','future'].includes(cue) ? <g {...strokes}><circle cx="50" cy="50" r="31"/><path d={cue === 'past' ? 'M50 29V50H29' : cue === 'future' ? 'M50 29V50H72' : 'M50 27V50L68 62'}/></g> : null}
  </svg>
}
function Diagram({ icon }: { icon: WordIcon }) {
  const id = useId().replaceAll(':','')
  const value = icon.value ?? ''
  const body = (() => {
    switch (icon.symbol) {
      case 'number': return <><rect x="8" y="16" width="84" height="68" rx="22"/><text x="50" y="65" textAnchor="middle" fill="#fff8eb" fontSize={value.length > 3 ? 30 : 43} fontWeight="800">{value}</text></>
      case 'person': case 'possession': {
        const plural = ['we','us','they','together','separate'].includes(value)
        const receive = ['us','speaker-object'].includes(value)
        return <>
          {value !== 'thing' ? <Person x={plural ? 33 : 50} y={43} size={.85}/> : null}{plural ? <Person x={72} y={43} size={.85} color={`url(#${id}-gold)`}/> : null}
          {['speaker','speaker-object','we','us'].includes(value) ? <path d="M12 8H34V24H24L17 32V24H12Z" fill="#d9c8e2"/> : null}
          {value === 'listener' ? <path d="M12 14H36L28 6M36 14L28 22" {...strokes}/> : null}
          {['him','her'].includes(value) ? <text x="80" y="25" fontSize="25" fill="#846e9c">{value === 'him' ? '♂' : '♀'}</text> : null}
          {value === 'thing' ? <rect x="29" y="25" width="42" height="42" rx="9" fill={`url(#${id}-gold)`}/> : null}
          {icon.symbol === 'possession' ? <><path d="M50 68V80" {...strokes}/><rect x="37" y="78" width="26" height="20" rx="6" fill={`url(#${id}-gold)`}/></> : <path d={receive ? 'M14 88H76L64 76M76 88L64 98' : value === 'separate' ? 'M40 88H10L20 78M10 88L20 98M60 88H90L80 78M90 88L80 98' : value === 'together' ? 'M14 88H42L32 78M42 88L32 98M86 88H58L68 78M58 88L68 98' : 'M75 88H22L34 76M22 88L34 98'} {...strokes}/>}
        </>
      }
      case 'relation': return <><circle cx="22" cy="50" r="17"/><rect x="65" y="33" width="32" height="34" rx="10" fill={`url(#${id}-gold)`}/><path d={value === 'receive' ? 'M68 50H40L50 40M40 50L50 60' : value === 'action' ? 'M39 50H62L52 40M62 50L52 60' : 'M39 45H63M39 55H63'} {...strokes}/>{value === 'exists' ? <path d="M42 16H58M50 8V24" {...strokes}/> : null}</>
      case 'time': {
        const focus = ['past','before','first'].includes(value) ? 22 : ['future','after','next','last','end'].includes(value) ? 78 : 50
        return <><path d="M10 60H90M50 42V79" {...strokes} stroke="#b9b6a7"/><circle cx={focus} cy="60" r="13"/>
          {['duration','until','while','continue'].includes(value) ? <><path d={value === 'while' ? 'M20 30H80M20 42H80' : 'M20 30V22H80V30'} {...strokes}/><path d="M20 60H80" {...strokes}/></> : null}
          {['start','end'].includes(value) ? <path d={`M${value === 'start' ? 22 : 78} 18V45`} {...strokes}/> : null}
          {value === 'done' ? <path d="M15 24L26 35L43 15" {...strokes}/> : null}
          {['often','once','twice'].includes(value) ? <><path d="M20 26Q50 0 78 26L64 28M78 26V12" {...strokes}/>{value !== 'often' ? <text x="50" y="95" textAnchor="middle" fontSize="24" fill="#4c726b">×{value === 'once' ? 1 : 2}</text> : <path d="M22 83H25M48 83H51M74 83H77" {...strokes}/>}</> : null}
          {value === 'now' ? <path d="M39 15L50 30L61 15" {...strokes}/> : null}
          {value === 'future' ? <path d="M22 24H70L59 13M70 24L59 35" {...strokes}/> : null}
        </>
      }
      case 'position': {
        const dot: Record<string,[number,number]> = {inside:[50,53],outside:[86,53],into:[50,53],at:[50,53],beside:[85,55],behind:[50,25],above:[50,15],off:[87,77],near:[34,72],far:[77,23],here:[34,72],there:[77,23],opposite:[83,50]}
        const [x,y] = dot[value] ?? [50,53]
        return <>{value === 'behind' ? <circle cx={x} cy={y} r="14" fill={`url(#${id}-gold)`}/> : null}<rect x="18" y="32" width="53" height="48" rx="9" fill={value === 'behind' ? `url(#${id}-sage)` : '#e6ece2'} stroke="#7c9c90" strokeWidth="5"/>{value !== 'behind' ? <circle cx={x} cy={y} r="12" fill={`url(#${id}-gold)`}/> : null}{value === 'into' ? <path d="M50 5V41L40 30M50 41L60 30" {...strokes}/> : null}{['near','far','here','there'].includes(value) ? <Person x={13} y={80} size={.4}/> : null}</>
      }
      case 'arrow': return <Arrow direction={value}/>
      case 'choice': return <g {...strokes}><path d="M50 84V50L20 20M50 50L80 20M12 35L20 20L35 23M65 23L80 20L88 35"/></g>
      case 'cause': return <><circle cx="17" cy="50" r="14"/><path d="M38 50H63L55 42M63 50L55 58" {...strokes}/><path d="M83 27L98 50L83 73L68 50Z" fill={`url(#${id}-gold)`}/></>
      case 'condition': return <><path d="M50 8L75 33L50 58L25 33Z"/><path d="M50 58V70L25 92M50 70L75 92" {...strokes}/><text x="50" y="43" textAnchor="middle" fill="#fff" fontSize="28">?</text></>
      case 'amount': {
        const count = ['one-of','remaining'].includes(value) ? 1 : value === 'some' ? 3 : 6
        return <>{Array.from({length:6},(_,i)=><circle key={i} cx={22+(i%3)*28} cy={30+Math.floor(i/3)*34} r="10" fill={i<count ? `url(#${id}-sage)` : '#dad5c9'}/>)}{['total','full'].includes(value) ? <rect x="7" y="13" width="86" height="69" rx="15" fill="none" stroke="#c4a46a" strokeWidth="5"/> : null}{value === 'too' ? <path d="M85 13V89M91 17L98 24" {...strokes} stroke="#b47f6c"/> : null}</>
      }
      case 'question': return <><text x="53" y="62" textAnchor="middle" fill={`url(#${id}-sage)`} fontSize="78" fontWeight="800">?</text>{value === 'place' ? <path d="M50 67Q12 87 50 97Q88 87 50 67Z" fill={`url(#${id}-gold)`}/> : value === 'time' ? <g {...strokes}><circle cx="50" cy="81" r="14"/><path d="M50 71V81H58"/></g> : value === 'reason' ? <path d="M22 81H80L67 69M80 81L67 93" {...strokes}/> : <path d="M18 84H35L45 72L57 90L76 74" {...strokes}/>}</>
      case 'no': return <g {...strokes} stroke="#ae7c70"><circle cx="50" cy="50" r="35"/><path d="M25 25L75 75"/></g>
      case 'yes': return <><circle cx="50" cy="50" r="37"/><path d="M26 51L43 68L76 32" {...strokes} stroke="#fff7e8"/></>
      case 'polite': return <><path d="M22 82L43 25Q50 12 50 31V75M78 82L57 25Q50 12 50 31V75" fill={`url(#${id}-gold)`} stroke="#b89865" strokeWidth="4"/><path d="M12 23L21 33M88 23L79 33" {...strokes}/></>
      case 'purpose': return <><circle cx="21" cy="50" r="16"/><path d="M41 50H63L54 41M63 50L54 59" {...strokes}/><path d="M82 26L89 41L99 45L89 57L91 73L77 66L65 73L68 57L59 45L74 41Z" fill={`url(#${id}-gold)`}/></>
      case 'action': return <><path d="M30 15L80 50L30 85Z"/>{value === 'did' ? <path d="M10 15V85" {...strokes} stroke="#c6a268"/> : <circle cx="83" cy="18" r="10" fill={`url(#${id}-gold)`}/>}</>
      case 'part': return <><rect x="13" y="20" width="73" height="64" rx="14" fill="#e7e4d8" stroke="#9eafa0" strokeWidth="5"/><rect x="24" y="32" width="28" height="39" rx="7" fill={value === 'missing' ? 'none' : `url(#${id}-sage)`} stroke="#6c9386" strokeWidth="4" strokeDasharray={value === 'missing' ? '4 5' : undefined}/>{value === 'each' ? <><circle cx="68" cy="42" r="7"/><circle cx="68" cy="62" r="7"/></> : <path d="M61 50H77" {...strokes}/>}</>
      case 'name': return <><rect x="10" y="20" width="80" height="62" rx="12"/><Person x={32} y={50} size={.5} color="#f2e9d4"/><path d="M56 43H77M56 58H72" {...strokes} stroke="#f2e9d4"/></>
      case 'height': return <><rect x="22" y={value==='thick'?43:15} width="30" height={value==='thick'?35:70} rx="8"/><g transform="translate(42 0) scale(.6 1)"><Arrow direction={value==='down'?'down':'up'}/></g></>
      case 'warm': return <><path d="M18 80Q40 60 22 42T30 8M49 80Q71 60 53 42T61 8M80 80Q102 60 84 42" {...strokes} stroke="#caa16c"/></>
      case 'waist': return <><Person x={50} y={35} size={1.2}/><path d="M21 66H79" {...strokes} stroke="#d1a26b" strokeWidth="12"/><path d="M35 74L30 96M65 74L70 96" {...strokes}/></>
      case 'wrist': return <><path d="M20 98V57L33 46V15Q40 5 46 15V45H68Q82 45 82 62V77L65 98" fill={`url(#${id}-gold)`}/><path d="M25 76H72" {...strokes}/></>
      case 'balance': return <><path d="M50 12V87M18 87H82M15 30H85" {...strokes}/><path d="M15 32L3 62H27ZM85 32L73 62H97Z" fill={`url(#${id}-gold)`}/></>
      default: return null
    }
  })()
  return <svg className="meaning-icon-diagram" viewBox="0 0 100 105" aria-hidden="true" fill={`url(#${id}-sage)`} color={`url(#${id}-sage)`}>
    <defs><linearGradient id={`${id}-sage`} x2=".8" y2="1"><stop stopColor="#afc7b7"/><stop offset=".48" stopColor="#7ba292"/><stop offset="1" stopColor="#4c786c"/></linearGradient><linearGradient id={`${id}-gold`} x2=".8" y2="1"><stop stopColor="#ebd9b0"/><stop offset="1" stopColor="#bd985f"/></linearGradient></defs>{body}
  </svg>
}

export default function MeaningIcon({ icon }: { icon: WordIcon }) {
  return <span className="word-meaning-art" aria-hidden="true" title={icon.description}>
    {icon.asset ? <img className="meaning-icon-image" src={`/images/fimo/thumbs/word-${icon.asset}.png`} alt="" draggable={false}/> : <Diagram icon={icon}/>}
    {icon.secondary ? <img className="meaning-icon-secondary" src={`/images/fimo/thumbs/word-${icon.secondary}.png`} alt="" draggable={false}/> : null}
    {icon.cue ? <Cue cue={icon.cue}/> : null}
  </span>
}

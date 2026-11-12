import {possessiveFor} from '../sentenceRules/possessives'
import ProperNounIcon from './ProperNounIcon'
import VocabularyPicture from '../VocabularyPicture'
import './determinerIcon.css'
const ownership=['my','your','his','her','our','their']
const articles=['the','a','an']
const pointing=['this','that','these','those','that over there']
const meanings:Record<string,string>={the:'the particular item being identified',a:'one unspecified item',an:'one unspecified item before a vowel sound',some:'an unspecified group',this:'one item near the speaker',that:'one item near the listener',these:'items near the speaker',those:'items near the listener','that over there':'one more distant item'}
/** Meaning-specific artwork is shared by every determiner slot and word list. */
export default function DeterminerIcon({word}:{word:string}){
 const possessive=possessiveFor(word)
 if(possessive){const owner=possessive.possessor;return <span className="determiner-icon" data-determiner={word} role="img" aria-label={`${word}: ownership`}>{owner.kind==='name'?<ProperNounIcon word={owner.word}/>:<VocabularyPicture word={owner.phrase.noun}/>}</span>}
 const value=word.toLowerCase().trim()
 let src:string|undefined
 if(ownership.includes(value))src=`/classroom/icons/ownership/${value}${value==='their'?'-v4':['his','her'].includes(value)?'-v3':''}.png`
 else if(pointing.includes(value))src=`/classroom/icons/determiners/v2/${value==='that over there'?'over-there':value}.png`
 else if(articles.includes(value))src=`/classroom/icons/determiners/v1/${value}.png`
 return <span className="determiner-icon" data-determiner={value} data-scene={pointing.includes(value)||undefined} role="img" aria-label={`${value}: ${meanings[value]??'ownership'}`}>
  {src?<img className="determiner-icon-art" src={src} alt="" draggable={false}/>:value==='some'?<span className="determiner-icon-apples">{[0,1,2].map(i=><img key={i} src="/classroom/icons/level-three/apple.png" alt="" draggable={false}/>)}</span>:<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="3" y="25" width="20" height="30" rx="5" fill="#c3ccd4"/><rect x="30" y="18" width="24" height="44" rx="6" fill="#1877ef"/><rect x="61" y="25" width="16" height="30" rx="5" fill="#c3ccd4"/></svg>}
 </span>
}

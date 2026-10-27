import { wordOpacity, type FadeSettings, type WordScores } from '../wordProgress/model'
import './fadingWords.css'
/** Keeps punctuation, word widths and spaces intact; never installs reveal interactions. */
export default function FadingWords({text,scores={},settings={}}:{text:string;scores?:WordScores;settings?:FadeSettings}) {
 return <>{text.split(/([A-Za-z]+(?:[’'][A-Za-z]+)*[.,!?;:]*)/g).map((part,i)=>/[A-Za-z]/.test(part)?<span key={i} className="matrix-fading-word" data-word={part.match(/[A-Za-z]+(?:[’'][A-Za-z]+)*/)?.[0].toLowerCase()} style={{opacity:wordOpacity(part.match(/[A-Za-z]+(?:[’'][A-Za-z]+)*/)?.[0] ?? part,scores,settings)}}>{part}</span>:part)}</>
}

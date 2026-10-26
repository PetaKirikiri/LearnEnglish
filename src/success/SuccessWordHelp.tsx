import WordHelp from '../learning/WordHelp'
import WordMeaningTile from '../fimo/WordMeaningTile'
import type HotelWordHelp from '../hotel/HotelWordHelp'
import { speakEnglish } from '../learning/speech'
import { questionWords } from './course'
import { successTokenPattern } from './familiarity'

const translations:Record<string,string>={
  ...Object.fromEntries(questionWords.map(w=>[w.english.toLowerCase(),w.thai])),
  how:'อย่างไร; how much = เท่าไหร่; how many = กี่',
  much:'มาก; how much = เท่าไหร่',many:'หลาย; how many = กี่',
}
export default function SuccessWordHelp({question,onListen,onHelp,tokenOpacity}:Parameters<typeof HotelWordHelp>[0]) {
  return <WordHelp text={question.english} translations={translations} theme="hotel"
    tokenPattern={successTokenPattern}
    onHelp={onHelp} tokenOpacity={tokenOpacity} examplesForWord={(_word,context)=>[context]}
    renderToken={(word,punctuation,followingText,precedingText)=><WordMeaningTile word={word} punctuation={punctuation} followingText={followingText} precedingText={precedingText}/>}
    onListen={onListen??(()=>speakEnglish(question.english,question.audioUrl))}/>
}

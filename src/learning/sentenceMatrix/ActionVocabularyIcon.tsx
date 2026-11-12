import {actionVocabulary} from '../sentenceRules/actionDialogue'
import VocabularyPicture from '../VocabularyPicture'

/** Cards and selectors resolve artwork from the same semantic vocabulary entries. */
export function ActionIcon({word}:{word:string}) {
 const entry=actionVocabulary.find(action=>action.word===word||action.spoken===word)
 return entry ? <img className="cw-game-icon" src={entry.icon} alt="" draggable={false} style={{objectFit:'contain',background:'none'}}/> : null
}
export function ActionObjectIcon({word}:{word:string}) {
 return <VocabularyPicture word={word}/>
}

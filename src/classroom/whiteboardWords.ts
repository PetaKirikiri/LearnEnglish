import {lessonThreeMatrixCatalogue} from './wordCatalogue'
import {everydayPeopleCatalogue} from '../learning/everydayVocabulary'
import {allDeterminers,type MatrixLesson} from '../learning/sentenceMatrix/model'
import {rankWordChoices} from '../race/wordHierarchy'
/** Teacher exploration has the full authored inventory; sentence compatibility still applies. */
export function whiteboardWords(blueprint:MatrixLesson):MatrixLesson{
 const vocabulary=rankWordChoices([...new Map([...lessonThreeMatrixCatalogue,...everydayPeopleCatalogue].map(word=>[word.word,word])).values()])
 return {...blueprint,vocabulary,subjectNouns:everydayPeopleCatalogue,owners:allDeterminers.map(item=>item.word)}
}

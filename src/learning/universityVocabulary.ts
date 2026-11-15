import {cumulativeCatalogue,lessonThreeMatrixCatalogue} from '../classroom/wordCatalogue'
import {everydayPeopleCatalogue} from './everydayVocabulary'
import {expandedEverydayCatalogue} from './expandedEverydayVocabulary'
/** Full shared inventory. Recorded lesson archives keep their original membership. */
export const universityVocabulary=cumulativeCatalogue(lessonThreeMatrixCatalogue,everydayPeopleCatalogue,expandedEverydayCatalogue)

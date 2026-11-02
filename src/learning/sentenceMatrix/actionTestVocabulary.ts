import {lessonThreeMatrixCatalogue} from '../../classroom/wordCatalogue'
export const testVocabulary=['apple','banana','sandwich','water','book','hotel','gym','toilet','restaurant'].map(word=>lessonThreeMatrixCatalogue.find(item=>item.word===word)!)

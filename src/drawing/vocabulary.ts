import {lessonThreeMatrixCatalogue} from '../classroom/wordCatalogue'
// Reuse the course catalogue. Plural-only and mass nouns do not fit “That is a/an …”.
export const drawingVocabulary=lessonThreeMatrixCatalogue.filter(w=>w.number!=='plural'&&!w.pairOnly&&w.word!=='water').map(w=>({word:w.word,thai:w.thai,english:`${w.indefiniteArticle??(/^[aeiou]/i.test(w.word)?'an':'a')} ${w.word}`,forms:[w.word,...(w.plural?[w.plural]:[])],starter:['shoe','key','sock','bag','book','pen'].includes(w.word)}))

import type { HotelQuestion } from '../hotel/course'
import type { ExampleUnit } from '../learning/ExampleLanguage'

export const classOneId='9a1254a8-f3d7-4b85-a312-337ffd4df090'
export const classOneSkill='class-one-everyday-questions'
export const classOneLesson={id:classOneId,number:1,title:'Class 1',date:'2026-10-26',skills:[classOneSkill],published:true}
export const classOneWords=[
  ['A person','คนหนึ่งคน'],['People','ผู้คน'],['A man','ผู้ชายหนึ่งคน'],['A woman','ผู้หญิงหนึ่งคน'],
  ['A child','เด็กหนึ่งคน'],['Children','เด็กหลายคน'],['Water','น้ำ'],['Food','อาหาร'],
  ['A bag','กระเป๋าหนึ่งใบ'],['A phone','โทรศัพท์หนึ่งเครื่อง'],['A book','หนังสือหนึ่งเล่ม'],['A house','บ้านหนึ่งหลัง'],
] as const
export const classOneQuestionWords=[
  ['Who?','ใคร','อะไร'],['What?','อะไร','ใคร'],['Where?','ที่ไหน','เมื่อไหร่'],
  ['When?','เมื่อไหร่','ที่ไหน'],['Why?','ทำไม','ที่ไหน'],
  ['How much?','เท่าไหร่','กี่'],['How many?','กี่','เท่าไหร่'],
] as const
type Example={english:string;thai:string;units:ExampleUnit[]}
// The only new construction after the words: "… is this?". Who/What are
// already practised. No new object, location, action or tense is smuggled in.
export const classOneExamples:Example[]=[
  {english:'Who is this?',thai:'นี่คือใคร',units:[{english:'Who',thai:'ใคร'},{english:'is this?',thai:'นี่คือ'}]},
  {english:'What is this?',thai:'นี่คืออะไร',units:[{english:'What',thai:'อะไร'},{english:'is this?',thai:'นี่คือ'}]},
]
function question(id:string,english:string,thai:string,other:string,correct:0|1,audioUrl:string,context:string,contrast:string):HotelQuestion{
  return {id:`hotel-g3-general-class-one-${id}`,skill:classOneSkill,english,correct,audioUrl,
    answers:(correct?[other,thai]:[thai,other]).map(text=>[{text,skill:classOneSkill}]) as HotelQuestion['answers'],
    grammar:{kind:'meaning',context,phase:'practice',targets:[english.toLowerCase()],contrast,explanation:`${english} = ${thai}`}}
}
export const classOneQuestions=classOneQuestionWords.map(([english,thai,other],i)=>question(
  `question-word-${i+1}`,english,thai,other,(i%2) as 0|1,`/audio/class-one/question-word-${i+1}.wav`,`question-word-${i+1}`,classOneQuestionWords.find(w=>w[1]===other)![0]))
export const classOneVocabularyQuestions=classOneWords.map(([english,thai],i)=>question(
  `word-${i+1}`,english,thai,classOneWords[i%2?i-1:i+1][1],(i%2) as 0|1,`/audio/class-one/word-${i+1}.wav`,`vocabulary-${Math.floor(i/2)}`,classOneWords[i%2?i-1:i+1][0]))
export const classOneFrameQuestions=classOneExamples.map((example,i)=>({...question(
  `identity-${i+1}`,example.english,example.thai,classOneExamples[1-i].thai,i as 0|1,`/audio/class-one/identity-${i+1}.wav`,'identity-question',classOneExamples[1-i].english),
  grammar:{kind:'meaning' as const,context:'identity-question',phase:'practice' as const,targets:[i?'what':'who'],
    contrast:classOneExamples[1-i].english,explanation:'Who = ใคร · What = อะไร · is this? = นี่คือ…?'},
}))
// Shared order for class material and homework. A construction is one new
// unit; recognition of isolated nouns is not evidence for a sentence.
export const classOneStages=[
  {id:'question-words',title:'Question words',introduces:classOneQuestionWords.map(w=>w[0]),requires:[],questions:classOneQuestions},
  {id:'everyday-words',title:'People & everyday things',introduces:classOneWords.map(w=>w[0]),requires:['question-words'],questions:classOneVocabularyQuestions},
  {id:'first-questions',title:'Who is this? · What is this?',introduces:['… is this?'],requires:['question-words','everyday-words'],questions:classOneFrameQuestions},
]
export const classOnePracticeQuestions=classOneStages.flatMap(stage=>stage.questions)
export const classOneAudio=classOnePracticeQuestions.map(q=>({spokenText:q.english,audioUrl:q.audioUrl!}))

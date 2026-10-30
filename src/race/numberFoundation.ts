/** A small, reused noun set: /s/, /z/ and /ɪz/ endings, no translation test. */
export const numberNouns=[
 {singular:'hotel',plural:'hotels',thai:'โรงแรม'},
 {singular:'phone',plural:'phones',thai:'โทรศัพท์'},
 {singular:'key',plural:'keys',thai:'กุญแจ'},
 {singular:'book',plural:'books',thai:'หนังสือ'},
 {singular:'watch',plural:'watches',thai:'นาฬิกาข้อมือ'},
] as const
/** New concrete nouns for sentence practice; each has existing classroom artwork. */
export const sentenceNumberNouns=[
 ...numberNouns,
 {singular:'chair',plural:'chairs',thai:'เก้าอี้'},
 {singular:'table',plural:'tables',thai:'โต๊ะ'},
 {singular:'bag',plural:'bags',thai:'กระเป๋า'},
 {singular:'shoe',plural:'shoes',thai:'รองเท้า'},
 {singular:'sock',plural:'socks',thai:'ถุงเท้า'},
] as const
export const numberNounPool=(module:number)=>module===1?numberNouns:sentenceNumberNouns
export type NumberPrompt={id:string;word:string;thai:string;plural:boolean;audioUrl:string;verb?:'is'|'are'}
export const numberRecordings=sentenceNumberNouns.flatMap(noun=>[noun.singular,noun.plural].map(word=>({audioUrl:`/audio/number-foundation/the-${word}.wav`,spokenText:`the ${word}`})))
export const numberSentenceText=(prompt:Pick<NumberPrompt,'word'|'plural'|'verb'>)=>`Where ${prompt.verb??(prompt.plural?'are':'is')} the ${prompt.word}?`
export const numberSentenceAudio=(prompt:Pick<NumberPrompt,'word'|'plural'|'verb'>)=>`/audio/number-foundation/where-${prompt.verb??(prompt.plural?'are':'is')}-the-${prompt.word.replaceAll(' ','-')}.wav`
export const numberSentenceRecordings=sentenceNumberNouns.flatMap(noun=>[false,true].map(plural=>{
 const prompt={word:plural?noun.plural:noun.singular,plural}
 return {audioUrl:numberSentenceAudio(prompt),spokenText:numberSentenceText(prompt)}
}))
export function numberDeck(module:1|2|3=1):NumberPrompt[]{
 // Round 1: three encounters per form. Later rounds: review each familiar
 // form once and practise each new form twice, keeping 30 balanced questions.
 const prompts=numberNounPool(module).flatMap((noun,index)=>
  Array.from({length:module===1?3:index<numberNouns.length?1:2},(_,round)=>
   [false,true].map(plural=>({id:`${round}-${plural?noun.plural:noun.singular}`,word:plural?noun.plural:noun.singular,thai:noun.thai,plural,audioUrl:`/audio/number-foundation/the-${plural?noun.plural:noun.singular}.wav`}))
  ).flat()
 )
 // First exposure is the requested hotel contrast. Later order is unpredictable.
 const first=prompts.splice(0,2)
 for(let i=prompts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[prompts[i],prompts[j]]=[prompts[j],prompts[i]]}
 return [...first,...prompts].map((prompt,index)=>module===3?{...prompt,verb:(index%2===0?prompt.plural:!prompt.plural)?'are':'is'}:prompt)
}
export function numberPassed(deck:readonly NumberPrompt[],answers:readonly boolean[]){
 if(deck.length!==30||answers.length!==30)return false
 const score=answers.filter(Boolean).length
 return score>=27&&[false,true].every(plural=>deck.filter((q,i)=>q.plural===plural&&answers[i]).length>=12)
}
export const foundationKey=(user?:string)=>`englishsuccess:number-foundation:v1:${user??'guest'}`

/** Answer zero means correct in sentence judgement, singular in number recognition. */
export const numberAnswer=(prompt:NumberPrompt,module:number)=>module===3?Number((prompt.verb==='are')!==prompt.plural):Number(prompt.plural)
export function withJudgement(prompt:NumberPrompt,module:number,answered:readonly NumberPrompt[]=[]):NumberPrompt {
 if(module!==3)return prompt
 const correctCount=answered.filter(q=>numberAnswer(q,3)===0).length
 const valid=answered.length===0||Math.random()<(15-correctCount)/(30-answered.length)
 return {...prompt,verb:(valid?prompt.plural:!prompt.plural)?'are':'is'}
}

/** Content and grammatical agreement for the subject block, independent of its host UI. */
export type NounMode='noun'|'pronoun'|'name'
export type SubjectWord={word:string;thai:string;person?:1|2|3;number?:'singular'|'plural';kind?:'person'|'place'}
export type SubjectModeConfig={
 pronouns:readonly SubjectWord[]
 names:readonly SubjectWord[]
 initialPronoun?:string
 initialName?:string
 audio?:(sentence:string,mode:Exclude<NounMode,'noun'>)=>string|undefined
}
export const subjectPronouns=[
 {word:'I',thai:'ฉัน',person:1},
 {word:'you',thai:'คุณ',person:2},
 {word:'he',thai:'เขา',person:3},
 {word:'she',thai:'เธอ',person:3},
] as const
export function subjectVerb(subject:SubjectWord):'am'|'are'|'is'{
 if(subject.number==='plural'||subject.person===2)return 'are'
 return subject.person===1?'am':'is'
}
export function subjectModes(config:SubjectModeConfig):NounMode[]{
 return ['noun',...(config.pronouns.length?['pronoun' as const]:[]),...(config.names.length?['name' as const]:[])]
}
export const subjectChoices=(config:SubjectModeConfig,mode:Exclude<NounMode,'noun'>)=>mode==='pronoun'?config.pronouns:config.names
export function subjectQuestion(config:SubjectModeConfig,mode:Exclude<NounMode,'noun'>,selected?:string){
 const choices=subjectChoices(config,mode)
 const initial=mode==='pronoun'?config.initialPronoun:config.initialName
 const item=choices.find(item=>item.word===selected)??choices.find(item=>item.word===initial)??choices[0]
 if(!item)throw new Error(`No configured words for subject mode: ${mode}`)
 const verb=subjectVerb(item)
 return {item,verb,english:`Where ${verb} ${item.word}?`,thai:`${item.thai}${mode==='name'?' ':''}อยู่ที่ไหน`,
  units:[{english:'Where',thai:'ที่ไหน'},{english:verb,thai:'อยู่'},{english:`${item.word}?`,thai:item.thai}]}
}

/** Keep an agreeing selection; otherwise prefer the familiar beginner pronoun. */
export function subjectForVerb(choices:readonly SubjectWord[],verb:'am'|'is'|'are',current?:string){
 const matching=choices.filter(item=>subjectVerb(item)===verb)
 return matching.find(item=>item.word===current)
   ?? matching.find(item=>item.word===(verb==='am'?'I':verb==='are'?'you':'he'))
   ?? matching[0]
}
export function subjectVerbChoices(choices:readonly SubjectWord[]){
 return (['am','is','are'] as const).filter(verb=>choices.some(item=>subjectVerb(item)===verb)).map(word=>({word,thai:choices.filter(item=>subjectVerb(item)===word).map(item=>item.word).join(' / ')}))
}

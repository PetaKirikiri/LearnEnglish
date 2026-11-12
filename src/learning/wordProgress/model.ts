export const WORD_RULE_VERSION = 1
export const QUESTION_VERSION = 1
export type WordProgress = { word_id:string; correct:number; attempts:number; listening_correct:number; direct_correct:number; last_practised:string; recent_results:boolean[];fade_score?:number;confirmation_count?:number;proven_at?:string|null;review_due_at?:string|null;review_step?:number;reviewed_at?:string|null;lapsed_at?:string|null;learning_updated_at?:string|null;learning_version?:number }
export type WordScores = Readonly<Record<string,number>>
export type FadeSettings = { fadeMode?:boolean; fadeStart?:number; fadeEnd?:number }
export function wordTokens(text:string) { return text.toLowerCase().replaceAll('’',"'").match(/[a-z]+(?:'[a-z]+)*/g) ?? [] }
export const wordId=(word:string)=>`en:${wordTokens(word).join('')}`
/** Five successes retain full support; the next twenty remove it gradually. */
export function wordOpacity(word:string,scores:WordScores={},settings:FadeSettings={}) {
 if(!settings.fadeMode)return 1
 const start=Math.max(0,settings.fadeStart??5),end=Math.max(start+1,settings.fadeEnd??25)
 return Math.max(0,Math.min(1,1-((scores[wordId(word)]??0)-start)/(end-start)))
}
export function scoresFromProgress(rows:WordProgress[]):WordScores {return Object.fromEntries(rows.map(row=>[row.word_id,row.fade_score??row.correct]))}
export type WordAttempt={id:string;questionId:string;version:number;answer:string;occurredAt:string;modality:'visible'|'faded'|'audio';replays:number;ruleVersion:number}

export function sentenceModality(english:string,scores:WordScores,settings:FadeSettings):WordAttempt['modality']{
 const opacity=wordTokens(english).map(word=>wordOpacity(word,scores,settings))
 if(opacity.every(value=>value===0))return 'audio'
 return opacity.some(value=>value<1)?'faded':'visible'
}

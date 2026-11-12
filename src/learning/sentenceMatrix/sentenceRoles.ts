/** Semantic roles determine colour; position and visual grouping never do. */
export type LanguageRole='question'|'be'|'person'|'action'|'object'|'determiner'|'preposition'|'person-determiner'|'description'|'reference'
export const sentenceRoleSlots:Readonly<Record<LanguageRole,number>>={
 question:0,preposition:0,be:1,action:1,determiner:2,'person-determiner':2,person:3,object:3,description:3,reference:3,
}
/** Legacy displays without authored roles still use the same presentation types. */
export function sentenceUnitRole(unit:{english:string;role?:LanguageRole},slot?:number):LanguageRole{
 if(unit.role)return unit.role
 const word=unit.english.toLowerCase().replace(/[?.,!]/g,'').trim()
 if(/^(i|you|he|she|it|we|they|bia)$/.test(word))return 'person'
 if(/^(am|is|are|was|were|be|been|being)$/.test(word))return 'be'
 if(slot===1)return 'action'
 if(/^(where|what|who|when|why|how)$/.test(word))return 'question'
 if(slot===0||/^(at|to|in|on|from)$/.test(word))return 'preposition'
 if(slot===2||/^(the|a|an|some|this|that|these|those|my|your|his|her|our|their)$/.test(word))return 'determiner'
 return 'object'
}
export function sentenceVerbType(role:LanguageRole,roles:readonly LanguageRole[]){
 return role==='be'?(roles.includes('action')?'auxiliary-verb':'linking-verb'):role==='action'?'main-verb':undefined
}
export const sentenceVerbLabels={'auxiliary-verb':'Auxiliary verb','linking-verb':'Linking verb','main-verb':'Main verb'} as const

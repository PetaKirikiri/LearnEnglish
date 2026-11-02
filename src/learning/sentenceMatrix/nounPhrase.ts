/** A noun phrase is a composition, never a single vocabulary card. */
export type NounPhrase = {
 noun:string
 nounThai:string
 determiner?:{english:string;thai:string}
 preposition?:{english:string;thai:string}
}
export function nounPhraseUnits(phrase:NounPhrase){
 if(/^(?:a|an|the|my|your|his|her|our|their|to)\s/i.test(phrase.noun))throw new Error('Keep determiners and prepositions separate from the noun.')
 return [
  ...(phrase.preposition?[{...phrase.preposition,role:'preposition' as const}]:[]),
  ...(phrase.determiner?[{...phrase.determiner,role:'determiner' as const}]:[]),
  {english:phrase.noun,thai:phrase.nounThai,role:'noun' as const},
 ]
}

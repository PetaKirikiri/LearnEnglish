/** Grammatical form belongs to the blueprint, independently of selected words. */
export type SentenceGrammar={
 tense:'present'
 aspect:'simple'|'continuous'
 finiteVerb:{role:'auxiliary-verb'|'linking-verb';tense:'present';forms:readonly ['am','is','are']|readonly ['do','does']}
 mainVerb?:{role:'main-verb';form:'present-participle'|'base';ending?:'ing'}
}
export const presentContinuousGrammar={tense:'present',aspect:'continuous',finiteVerb:{role:'auxiliary-verb',tense:'present',forms:['am','is','are']},mainVerb:{role:'main-verb',form:'present-participle',ending:'ing'}} as const satisfies SentenceGrammar
export const presentSimpleBeGrammar={tense:'present',aspect:'simple',finiteVerb:{role:'linking-verb',tense:'present',forms:['am','is','are']}} as const satisfies SentenceGrammar

export const presentSimpleDoGrammar={tense:'present',aspect:'simple',finiteVerb:{role:'auxiliary-verb',tense:'present',forms:['do','does']},mainVerb:{role:'main-verb',form:'base'}} as const satisfies SentenceGrammar

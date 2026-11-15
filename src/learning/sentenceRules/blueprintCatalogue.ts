import {presentContinuousGrammar,presentSimpleBeGrammar,type SentenceGrammar} from './sentenceGrammar'
import {activeActionBlueprints} from './actionBlueprints'
export type WordBinding={type:'noun-block';role:string;accepts?:string}|{type:'present-av'}|{type:'action'}|{type:'literal';word:string}
export type Part={label:string;kind:'noun'|'determiner'|'verb'|'question';role?:string;accepts?:string;binding:WordBinding}
export type Frame={id:string;title:string;grammar:SentenceGrammar;parts:readonly Part[]}
const nounBlock=(role:string,accepts?:string):Part=>({label:'noun block',kind:'noun',role,accepts,binding:{type:'noun-block',role,accepts}})
const verb=(label:string):Part=>({label,kind:'verb',binding:label==='AV:present'?{type:'present-av'}:label==='verb:ing'?{type:'action'}:{type:'literal',word:'doing'}})
const presentAV=():Part=>verb('AV:present')
const mainVerb=(label='verb:ing'):Part=>verb(label)
const fixed=(label:string):Part=>({label,kind:'question',binding:{type:'literal',word:label.split(':').at(-1)!}})
export const blueprintFrames:readonly Frame[]=[
 {id:'where',title:'Present simple · Location question',grammar:presentSimpleBeGrammar,parts:[fixed('interrogative:where'),presentAV(),nounBlock('subject')]},
 {id:'location',title:'Present simple · Location statement',grammar:presentSimpleBeGrammar,parts:[nounBlock('subject'),presentAV(),fixed('preposition:at'),nounBlock('location','place')]},
 {id:'activity',title:'Present continuous · Action question',grammar:presentContinuousGrammar,parts:[fixed('interrogative:what'),presentAV(),nounBlock('subject'),mainVerb('verb:doing')]},
 ...activeActionBlueprints.map(frame=>({id:frame.id,title:frame.connection==='direct'?'Present continuous · Transitive action':'Present continuous · Movement to a destination',grammar:frame.grammar??presentContinuousGrammar,parts:[nounBlock('subject'),presentAV(),mainVerb(),...(frame.connection==='direct'?[nounBlock('object')]:[fixed(`preposition:${frame.connection}`),nounBlock('destination','destination')])]})),
 {id:'identify-question',title:'Present simple · Identification question',grammar:presentSimpleBeGrammar,parts:[fixed('interrogative:what'),presentAV(),nounBlock('subject','det:deictic')]},
 {id:'identify-answer',title:'Present simple · Identification statement',grammar:presentSimpleBeGrammar,parts:[nounBlock('subject','det:deictic'),presentAV(),nounBlock('complement')]},
]

import type {SubjectWord} from '../sentenceMatrix/subjectEngine'
/** These nouns refer to the children depicted in the reviewed vocabulary artwork. */
const childSubjects=new Set(['boy','boys','girl','girls','son','sons','daughter','daughters','brother','brothers','sister','sisters','child','children'])
export function subjectCanPerform(subject:Pick<SubjectWord,'word'|'phrase'|'semanticNoun'>,action:string,object?:string){
 const noun=(subject.phrase?.noun??subject.semanticNoun??subject.word.replace(/^(?:the|my|your|his|her|our|their) /i,'')).toLowerCase()
 const child=childSubjects.has(noun)
 if(['family','families'].includes(noun)&&action==='driving')return false
 const target=object?.toLowerCase().replace(/[?.!]$/,'').replace(/^(?:to |on |at )?(?:the |a |an |my |your |his |her |our |their )?/,'').replace(/buses$/,'bus').replace(/motorbikes$/,'motorbike')
 if(['helping','teaching','watching','talking','listening','walking','running','going','visiting','coming'].includes(action)&&target===noun)return false
 return !(child&&(action==='driving'||action==='riding'&&target==='motorbike'||['buying','selling'].includes(action)&&['bus','motorbike','car','cars','air conditioner'].includes(target??'')))
}
/** Reviewed affordances: portable is not edible, washable is not every physical thing. */
export const nounActionAffordances={
 cookable:new Set(['food','rice']),
 cuttable:new Set(['apple','banana','orange','sandwich','bread']),
 depictable:new Set(['apple','banana','orange','cup','bottle','bag','shoe','shirt','hat','chair','table','bicycle','bus','motorbike','car','home']),
 paintable:new Set(['table','chair','home','room']),
 repairable:new Set(['phone','charger','bicycle','fan','air conditioner','laptop','camera','watch','clock','car','bus','motorbike','chair','table']),
 pushable:new Set(['chair','table','bicycle']),
 pullable:new Set(['chair','table','bag','bicycle']),
 liftable:new Set(['bag','book','bottle','cup','chair','plate','phone','towel','laptop']),
 visitable:new Set(['school','clinic','hotel','bank','bookstore','gym','restaurant','home']),
 drivable:new Set(['car','bus']),
 'sleep-inside':new Set(['bedroom','hotel']),
 'sleep-surface':new Set(['bed']),
 holdable:new Set(['phone','bag','cup','key','shirt','shoe','book','apple','bottle','plate','wallet','banana','orange','sandwich','towel','hat','sock','trousers','glasses','pen','pencil','umbrella','watch','charger','ticket','passport','laptop','camera','remote','sandal','boot','racket']),
 openable:new Set(['book','bag','bottle','wallet','umbrella','laptop','door','window','passport']),
 washable:new Set(['cup','plate','apple','banana','orange','bottle','shirt','shoe','towel','hat','sock','trousers','glasses','sandal','boot','bus','motorbike','bicycle']),
 cleanable:new Set(['table','chair','toilet','school','phone','key','bottle','plate','bus','motorbike','restaurant','bedroom','wallet','bank','clinic','glasses','watch','clock','fan','charger','air conditioner','bicycle','hotel','laptop','camera','remote','bookstore','gym','racket','padel court']),
 usable:new Set(['water','phone','bag','cup','key','table','chair','toilet','bottle','plate','bus','motorbike','wallet','towel','glasses','pen','pencil','umbrella','watch','clock','fan','charger','air conditioner','bicycle','ticket','passport','laptop','camera','remote','racket']),
 carryable:new Set(['phone','bag','cup','key','shirt','shoe','book','apple','bottle','plate','wallet','banana','orange','sandwich','towel','hat','sock','trousers','glasses','pen','pencil','umbrella','watch','charger','ticket','passport','laptop','camera','remote','sandal','boot','racket']),
 findable:new Set(['phone','bag','key','shirt','shoe','book','wallet','hat','sock','glasses','pen','pencil','umbrella','watch','charger','ticket','passport','laptop','camera','remote','sandal','boot','racket']),
 purchasable:new Set(['phone','bag','cup','key','shirt','shoe','table','chair','book','apple','bottle','plate','bus','motorbike','wallet','banana','orange','sandwich','towel','hat','sock','trousers','glasses','pen','pencil','umbrella','watch','clock','fan','charger','air conditioner','bicycle','ticket','laptop','camera','remote','sandal','boot','racket']),
 wearable:new Set(['shirt','shoe','hat','sock','trousers','glasses','watch','sandal','boot']),
 rideable:new Set(['bicycle','motorbike']),
 'public-transport':new Set(['bus']),
 watchable:new Set(['bus','motorbike','bicycle']),
 readable:new Set(['book','ticket','passport']),
} as const

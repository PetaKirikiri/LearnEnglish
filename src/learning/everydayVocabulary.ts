import type {ClassroomWord} from './sentenceMatrix/model'

/** One authored curriculum, independent of the sentence level a learner opens.
 * Priority combines Oxford beginner levels, everyday topics and learner needs.
 * See docs/VOCABULARY_PRIORITY.md; this is not a corpus-frequency ranking. */
export const everydayPeople=[
 {singular:'man',plural:'men',thai:'ผู้ชาย'},
 {singular:'woman',plural:'women',thai:'ผู้หญิง'},
 {singular:'boy',plural:'boys',thai:'เด็กผู้ชาย'},
 {singular:'girl',plural:'girls',thai:'เด็กผู้หญิง'},
 {singular:'mother',plural:'mothers',thai:'แม่'},
 {singular:'father',plural:'fathers',thai:'พ่อ'},
 {singular:'son',plural:'sons',thai:'ลูกชาย'},
 {singular:'daughter',plural:'daughters',thai:'ลูกสาว'},
] as const
export const everydayPeopleCatalogue:readonly ClassroomWord[]=everydayPeople.flatMap(p=>[
 {...p,word:p.singular,number:'singular' as const,categories:['people' as const],meaning:{kind:'person' as const,countability:'count' as const}},
 {...p,word:p.plural,number:'plural' as const,categories:['people' as const],meaning:{kind:'person' as const,countability:'count' as const}},
])
export const starterNouns=['man','woman','boy','girl','mother','father'] as const
export const everydayNounOrder=[...starterNouns,
 'son','daughter','phone','bag','water','cup','key',
 'shirt','shoe','table','chair','toilet','school','book','apple','bottle','plate',
 'bus','motorbike','restaurant','bedroom','wallet','bank','doctor','clinic',
 'banana','orange','sandwich','towel','hat','sock','trousers','glasses',
 'pen','pencil','umbrella','watch','clock','fan','charger','air conditioner',
 'bicycle','ticket','hotel','passport','laptop','camera','remote','sandal','boot',
 'bookstore','gym','racket','padel court',
] as const
export const everydayActionOrder=['eating','drinking','talking','listening','walking','running','sleeping','reading','playing','driving','opening','washing','holding'] as const
export const starterActions=['eating','drinking','talking','listening','walking','running'] as const
export const introductoryActions=everydayActionOrder.filter(word=>!['holding','opening','washing'].includes(word))
export const descriptions=[
 {word:'red',thai:'สีแดง',group:'colour',opposite:'blue',nouns:['bag','cup','phone','book','shirt'],colour:'#e32938'},
 {word:'blue',thai:'สีน้ำเงิน',group:'colour',opposite:'red',nouns:['bag','cup','phone','book','shirt'],colour:'#246fe0'},
 {word:'big',thai:'ใหญ่',group:'size',opposite:'small',nouns:['bag','cup','phone','book','plate','bottle'],colour:''},
 {word:'small',thai:'เล็ก',group:'size',opposite:'big',nouns:['bag','cup','phone','book','plate','bottle'],colour:''},
 {word:'hot',thai:'ร้อน',group:'temperature',opposite:'cold',nouns:['water'],colour:''},
 {word:'cold',thai:'เย็น',group:'temperature',opposite:'hot',nouns:['water'],colour:''},
 {word:'green',thai:'สีเขียว',group:'colour',opposite:'red',nouns:['bag','cup','phone','book','shirt'],colour:'#208550'},
 {word:'yellow',thai:'สีเหลือง',group:'colour',opposite:'blue',nouns:['bag','cup','phone','book','shirt'],colour:'#f8cd37'},
 {word:'black',thai:'สีดำ',group:'colour',opposite:'white',nouns:['bag','cup','phone','book','shirt'],colour:'#202a35'},
 {word:'white',thai:'สีขาว',group:'colour',opposite:'black',nouns:['bag','cup','phone','book','shirt'],colour:'#ffffff'},
] as const
export const descriptionStages=[['red','blue'],['big','small'],['hot','cold'],['green','yellow'],['black','white']] as const

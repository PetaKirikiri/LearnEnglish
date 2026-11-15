import {everydayActions} from './sentenceRules/everydayActions'
import {additionalPeople,expandedVocabularyOrder} from './expandedEverydayVocabulary'
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
 {singular:'brother',plural:'brothers',thai:'พี่ชายหรือน้องชาย'},
 {singular:'sister',plural:'sisters',thai:'พี่สาวหรือน้องสาว'},
 {singular:'friend',plural:'friends',thai:'เพื่อน'},
 {singular:'child',plural:'children',thai:'เด็ก'},
 {singular:'person',plural:'people',thai:'คน'},
 {singular:'family',plural:'families',thai:'ครอบครัว'},
 ...additionalPeople,
] as const
export const everydayPeopleCatalogue:readonly ClassroomWord[]=everydayPeople.flatMap(p=>[
 {...p,word:p.singular,number:'singular' as const,categories:['people' as const],meaning:{kind:'person' as const,countability:'count' as const,...(p.singular==='family'?{collective:true}:{})}},
 {...p,word:p.plural,number:'plural' as const,categories:['people' as const],meaning:{kind:'person' as const,countability:'count' as const,...(p.singular==='family'?{collective:true}:{})}},
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
 ...expandedVocabularyOrder,
] as const
export const everydayActionOrder=['eating','drinking','talking','listening','walking','holding','running','sleeping','reading','playing','driving','going','using','opening','washing','cleaning','carrying','finding','buying','closing','wearing','putting on','taking off','riding','catching','getting on','helping','watching','teaching','sitting','standing','waiting','arriving','leaving',...everydayActions.map(action=>action.word)] as const
export const starterActions=['eating','drinking','talking','listening','walking','running'] as const
export const introductoryActions=everydayActionOrder.filter(word=>!['holding','opening','washing'].includes(word))
const colouredObjects=['bag','cup','phone','book','shirt','shoe','bottle','plate','bus','motorbike','wallet','towel','hat','sock','trousers','glasses','pen','pencil','umbrella','watch','fan','charger','bicycle','laptop','camera','remote','sandal','boot','racket','chair','table','car','door','window','bed','ball','computer','television']
const sizedObjects=everydayNounOrder.filter(word=>!['water','food','rice','bread','milk','money','juice','coffee'].includes(word)&&word!=='doctor'&&!everydayPeople.some(person=>person.singular===word))
const heightNouns=[...everydayPeople.filter(person=>person.singular!=='family').map(person=>person.singular),'doctor','bottle']
const washableObjects=['shirt','shoe','sock','trousers','towel','plate','cup','bottle','window','floor','table','car','hand','bag']
const solidObjects=['bag','book','phone','chair','table','bed','box','bottle','cup','laptop','computer','ball','racket','door']
const possessions=[...colouredObjects,'house','school','hotel']
const feelingPeople=[...everydayPeople.filter(person=>person.singular!=='family').map(person=>person.singular),'doctor']
export const descriptions=[
 {word:'red',thai:'สีแดง',group:'colour',opposite:'blue',nouns:[...colouredObjects,'apple'],colour:'#e32938'},
 {word:'blue',thai:'สีน้ำเงิน',group:'colour',opposite:'red',nouns:colouredObjects,colour:'#246fe0'},
 {word:'big',thai:'ใหญ่',group:'size',opposite:'small',nouns:sizedObjects,colour:''},
 {word:'small',thai:'เล็ก',group:'size',opposite:'big',nouns:sizedObjects,colour:''},
 {word:'hot',thai:'ร้อน',group:'temperature',opposite:'cold',nouns:['water','sandwich','food','rice','bread','milk','coffee'],colour:''},
 {word:'cold',thai:'เย็น',group:'temperature',opposite:'hot',nouns:['water','sandwich','food','rice','bread','milk','juice','coffee'],colour:''},
 {word:'green',thai:'สีเขียว',group:'colour',opposite:'red',nouns:[...colouredObjects,'apple','banana'],colour:'#208550'},
 {word:'yellow',thai:'สีเหลือง',group:'colour',opposite:'blue',nouns:[...colouredObjects,'banana'],colour:'#f8cd37'},
 {word:'black',thai:'สีดำ',group:'colour',opposite:'white',nouns:colouredObjects,colour:'#202a35'},
 {word:'white',thai:'สีขาว',group:'colour',opposite:'black',nouns:colouredObjects,colour:'#ffffff'},
 {word:'tall',thai:'สูง',group:'height',opposite:'short',nouns:heightNouns,colour:''},
 {word:'short',thai:'เตี้ย',group:'height',opposite:'tall',nouns:heightNouns,colour:''},
 {word:'clean',thai:'สะอาด',group:'cleanliness',opposite:'dirty',nouns:washableObjects,colour:''},
 {word:'dirty',thai:'สกปรก',group:'cleanliness',opposite:'clean',nouns:washableObjects,colour:''},
 {word:'wet',thai:'เปียก',group:'moisture',opposite:'dry',nouns:['shirt','shoe','sock','trousers','towel','floor','hair','bag','umbrella'],colour:''},
 {word:'dry',thai:'แห้ง',group:'moisture',opposite:'wet',nouns:['shirt','shoe','sock','trousers','towel','floor','hair','bag','umbrella'],colour:''},
 {word:'new',thai:'ใหม่',group:'condition',opposite:'old',nouns:possessions,colour:''},
 {word:'old',thai:'เก่า',group:'condition',opposite:'new',nouns:possessions,colour:''},
 {word:'full',thai:'เต็ม',group:'capacity',opposite:'empty',nouns:['cup','bottle','bag','box','bus','glass'],colour:''},
 {word:'empty',thai:'ว่างเปล่า',group:'capacity',opposite:'full',nouns:['cup','bottle','bag','box','bus','glass'],colour:''},
 {word:'open',thai:'เปิดอยู่',group:'openness',opposite:'closed',nouns:['door','window','book','box','bag','umbrella'],colour:''},
 {word:'closed',thai:'ปิดอยู่',group:'openness',opposite:'open',nouns:['door','window','book','box','bag','umbrella'],colour:''},
 {word:'heavy',thai:'หนัก',group:'weight',opposite:'light',nouns:solidObjects,colour:''},
 {word:'light',thai:'เบา',group:'weight',opposite:'heavy',nouns:solidObjects,colour:''},
 {word:'happy',thai:'มีความสุข',group:'feeling',opposite:'sad',nouns:feelingPeople,colour:''},
 {word:'sad',thai:'เศร้า',group:'feeling',opposite:'happy',nouns:feelingPeople,colour:''},
 {word:'fast',thai:'เร็ว',group:'speed',opposite:'slow',nouns:['car','bus','motorbike','bicycle','train','boat','computer'],colour:''},
 {word:'slow',thai:'ช้า',group:'speed',opposite:'fast',nouns:['car','bus','motorbike','bicycle','train','boat','computer'],colour:''},
 {word:'soft',thai:'นุ่ม',group:'texture',opposite:'hard',nouns:['bed','chair','bread','ball','shoe'],colour:''},
 {word:'hard',thai:'แข็ง',group:'texture',opposite:'soft',nouns:['bed','chair','bread','ball','shoe'],colour:''},
 {word:'thick',thai:'หนา',group:'thickness',opposite:'thin',nouns:['book','towel','shirt','sock','bread','blanket'],colour:''},
 {word:'thin',thai:'บาง',group:'thickness',opposite:'thick',nouns:['book','towel','shirt','sock','bread','blanket'],colour:''},
 {word:'pink',thai:'สีชมพู',group:'colour',opposite:'purple',nouns:colouredObjects,colour:'#ed72af'},
 {word:'purple',thai:'สีม่วง',group:'colour',opposite:'pink',nouns:colouredObjects,colour:'#9254c8'},
 {word:'orange',thai:'สีส้ม',group:'colour',opposite:'brown',nouns:colouredObjects,colour:'#ef8b28'},
 {word:'brown',thai:'สีน้ำตาล',group:'colour',opposite:'orange',nouns:colouredObjects,colour:'#945d38'},
] as const
export const descriptionStages=[['red','blue'],['big','small'],['hot','cold'],['green','yellow'],['black','white'],['tall','short'],['clean','dirty'],['wet','dry'],['new','old'],['full','empty'],['open','closed'],['heavy','light'],['happy','sad'],['fast','slow'],['soft','hard'],['thick','thin'],['pink','purple'],['orange','brown']] as const

import type {GeneratedQuestion} from '../race/generatedPracticeContent'
import type {LanguageRole} from '../learning/sentenceMatrix/sentenceRoles'

type Answer = NonNullable<GeneratedQuestion['alternatives']>[number]
type Example = {question:string; answer:string; foil:string}

// Each spoken word has its own tile, including words inside a linked starter.
const examples: Record<string,Example> = {
 What:{question:'What is your name',answer:'My name is Som',foil:'My bag is blue'},
 'How old':{question:'How old is Som',answer:'She is 10 years old',foil:'She is happy'},
 How:{question:'How is Som feeling',answer:'She is happy',foil:'She is running'},
 Where:{question:'Where is Som',answer:'She is at school',foil:'She is happy'},
 'Where are':{question:'Where are the books',answer:'The books are at school',foil:'Som is reading'},
 'Where destination':{question:'Where are you going',answer:'I am going to school',foil:'I am happy'},
 'How big':{question:'How big is the bag',answer:'The bag is small',foil:'The bag is blue'},
 'What colour':{question:'What colour is Som wearing',answer:'She is wearing an orange shirt',foil:'She is at school'},
 Who:{question:'Who is helping Som',answer:'Her teacher is helping her',foil:'She is at school'},
 Which:{question:'Which bag is Som holding',answer:'She is holding the blue bag',foil:'She is holding 2 bags'},
 Whose:{question:'Whose bag is Som holding',answer:"She is holding Bia’s bag",foil:'She is holding the blue bag'},
 'How many':{question:'How many books is Som holding',answer:'She is holding 3 books',foil:'She is holding her books'},
 'How much':{question:'How much is Som paying',answer:'She is paying 20 baht',foil:'She is paying on Monday'},
 When:{question:'When is Som running',answer:'She is running on Monday',foil:'She is running at school'},
 'What time':{question:'What time does Som run',answer:'She runs at 9 o’clock',foil:'She runs at school'},
 'How long':{question:'How long is the lesson',answer:'The lesson is 30 minutes long',foil:'The lesson is on Monday'},
 'How often':{question:'How often does Som run',answer:'She runs every day',foil:'She runs for 10 minutes'},
 'How far':{question:'How far does Som run',answer:'She runs 2 kilometres',foil:'She runs for 10 minutes'},
 Why:{question:'Why is Som drinking water',answer:'She is thirsty',foil:'She is at school'},
}

const iconRoot='/classroom/icons/'
const deckArt = (name:string) => iconRoot+'question-deck/'+name+'.webp'
const art:Record<string,string>=Object.fromEntries(
 ['who','where','when','why','how','which','whose','how many','how much','how long','how often',
  'how far','how old','what time','what colour','feeling','thirsty','paying','minutes','monday',
  'every','day','years','kilometres','on','for','does','to','old'].map(word=>[word,deckArt(word.replaceAll(' ','-'))])
)
Object.assign(art,{
 which:iconRoot+'which-scenes/dresses.webp', whose:deckArt('whose-cue'), when:deckArt('when-cue'), why:deckArt('why-because'),
 name:deckArt('name'), how:iconRoot+'question-deck/how-asking.png', going:iconRoot+'actions/focused/going.png', feeling:deckArt('feeling-scale'), 'what colour':deckArt('colour'),lesson:iconRoot+'actions/focused/teaching.png',long:deckArt('how-long'), 'how big':iconRoot+'adjectives/3d/big.png', what:iconRoot+'constructions/what.png', doing:iconRoot+'constructions/doing.png',
 baht:iconRoot+'everyday/expanded/money.png', 'o’clock':deckArt('oclock'), 'bia’s':deckArt('bia-owner'),
 som:iconRoot+'people/som.png',she:iconRoot+'pronouns/she-standing.png',run:iconRoot+'actions/closeup/running.png', runs:iconRoot+'actions/running.png',
})
const wordChoices:Record<string,[string,string]>={
 What:['Table','At'], How:['Happy','School'],
 'What … called':['Som','Happy'], 'What … doing':['Running','School'],
 'How … feeling':['Happy','School'], 'How old':['10','Blue'], Where:['School','Happy'],
 'How big':['Small','Blue'], 'What colour':['Blue','Som'], Who:['Som','Table'],
 Which:['This','Happy'], Whose:['Bia’s','Running'], 'How many':['7','Table'],
 'How much':['฿20','Monday'], When:['Monday','Table'], 'What time':['9:00','Som'],
 'How long':['Hours','School'], 'How often':['Daily','Blue'], 'How far':['Kilometres','Happy'],
 Why:['Thirst','Monday'],
}
Object.assign(art,{
 called:deckArt('name'), hours:deckArt('how-long'),daily:deckArt('every'),thirst:deckArt('thirsty'),
 '฿20':iconRoot+'everyday/expanded/money.png','9:00':deckArt('oclock'),this:iconRoot+'deictic/v2/this.png',
 school:iconRoot+'level-one/school.png',table:iconRoot+'level-one/table.png',running:iconRoot+'actions/running.png',
})
const groups:Partial<Record<LanguageRole,string[]>>={
 person:['som','she','i','you'],determiner:['my','your','a','an','the','her','bia’s','every'],be:['is','are','does','am'],
 action:['going','running','helping','doing','drinking','holding','paying','run','runs','reading','wearing','feeling'],
 description:['happy','thirsty','blue','orange','old','small'],preposition:['for','at','on','to'],
}

function sentence(text:string,starter?:string):Answer{
 const words=text.split(' ')
 const starterWords=starter==='Where are'?1:starter?.split(' ').length??0
 const units=words.map((token,index)=>{
  const word=token.toLowerCase()
  const role:LanguageRole=index<starterWords?'question':word==='her'&&index===words.length-1?'person':
   (Object.keys(groups) as LanguageRole[]).find(key=>groups[key]?.includes(word))??'object'
  const src=index===1&&starterWords===2?art[starter!.toLowerCase()]:word==='at'&&/^\d+$/.test(words[index+1]??'')?deckArt('at-time'):word==='her'&&role==='person'?deckArt('object-her'):art[word]
  const artwork=/^\d+$/.test(word)?{numeral:Number(word)}:src?{src}:undefined
  return {english:token+(index===words.length-1?(starter?'?':'.'):''),thai:'',role,artwork,
   referent:role==='person'&&['she','her'].includes(word)?'girl':undefined}
 })
 return {english:units.map(unit=>unit.english).join(' '),thai:'',units,construction:starter?'question':'action-answer'}
}

export function generalQuestionDeck():GeneratedQuestion[]{
 return Object.entries(examples).map(([family,example])=>{
  const starter=family==='Where destination'?'Where':family
  const prompt=sentence(example.question,starter)
  const joined=family.includes(' ') || ['be','determiner'].includes(prompt.units[1]?.role)&&prompt.units[0].role==='question'
  const correct=Math.random()<0.5?0:1
  const answer=sentence(example.answer),foil=sentence(example.foil)
  const alternatives:[Answer,Answer]=correct===0?[answer,foil]:[foil,answer]
  return {id:'interrogative-'+family.replaceAll(' ','-'),version:1,level:1,
   document:{...prompt,questionLayout:{construction:'question',noun:'single',ungroupedTail:true,questionStarterSize:joined?2:undefined,leadingCount:prompt.units.length-(joined?2:1)}},
   choices:[alternatives[0].english,alternatives[1].english],alternatives,correct,targetWords:[starter],
   listeningWords:['Som'],family:starter,vocabulary:['Som'],action:'',owner:'the',subject:'Som',plural:false,kind:'meaning',credit:null}
 })
}

export type QuestionLessonLevel=7|8
export function questionLessonDeck(level:QuestionLessonLevel):GeneratedQuestion[]{
 const seen=new Set<string>()
 const deck=generalQuestionDeck().flatMap(q=>{
  const cue=q.family==='Where are'?'Where':q.family
  if(level===7&&seen.has(cue))return []
  seen.add(cue)
  // Use stable answer ordering for the scoring service; the UI may shuffle.
  const cues=level===8?[cue]:cue==='What'?['What','What … called','What … doing']:cue==='How'?['How','How … feeling']:[cue]
  return cues.map(label=>{
   const words=label.split(' … ')
   const document=level===7?{
    english:words.join(' '),thai:'',construction:'question' as const,
    questionLayout:{construction:'question' as const,noun:'single' as const,leadingCount:words.length-1,ungroupedTail:true},
    units:words.map(word=>({english:word,thai:'',role:'question' as const,artwork:{src:art[word.toLowerCase()]}})),
   }:q.document
   const alternatives:[Answer,Answer]=level===7
    ? wordChoices[label].map(word=>{
      const doc=sentence(word)
      return {...doc,english:word,units:doc.units.map(unit=>({...unit,english:word}))}
     }) as [Answer,Answer]
    : [q.alternatives![q.correct],q.alternatives![1-q.correct]]
   const id=level===7?'daily-question-7-interrogative-'+label.replaceAll(' … ','-').replaceAll(' ','-'):'daily-question-8-'+q.id
   return {...q,id,document,alternatives,choices:[alternatives[0].english,alternatives[1].english] as [string,string],correct:0 as const,
    targetWords:[cue],listeningWords:[label],credit:cue}
  })
 })
 if(level===8)return deck
 const order=['What','Who','Where','When','Which','Whose','Why','How',
  'What called','What doing','What colour','What time','How feeling','How old',
  'How big','How many','How much','How long','How often','How far']
 return deck.sort((a,b)=>order.indexOf(a.document.english)-order.indexOf(b.document.english))
}

// Hand-authored visual specimens, not a parser, exercise bank or mastery model.
// Neutral mating ends show reading order only; they do not validate grammar.
export const artwork = {
  noun: 'noun-494264a4fd196275.webp',
  determiner: 'determiner-5ef0bdf696394e27.webp',
  person: 'pronoun-singular-76159f4e6eb62685.webp',
  question: 'question-38360a17d516a3ce.webp',
  time: 'tense-2cac064917242b7a.webp',
  position: 'position-fd82a37a4f3b56ff.webp',
  action: 'success-wolf-grey-clay.png',
} as const
export type Role = keyof typeof artwork
export const meaningArtwork = {
  who: 'word-who.png',
  what: 'word-what.png',
  isLocation: 'word-is-location.png',
  on: 'word-on.png',
  the: 'word-the-shared.png',
  court: 'word-court.png',
} as const
export type Piece = { word: string; role: Role; label: string; note: string; focus?: boolean; meaningIcon?: keyof typeof meaningArtwork }
// Meaning is authored per occurrence: location-linking “is” is not progressive “is”.
export function pieceArtwork(piece: Piece): string {
  if (piece.meaningIcon) return meaningArtwork[piece.meaningIcon]
  if (piece.role === 'person' && /^(we|us|they|them)\b/i.test(piece.word)) return 'pronoun-plural-80e20e7fdf5e9379.webp'
  return artwork[piece.role]
}
export type Specimen = { title: string; caption: string; rows: { label: string; pieces: Piece[]; audio?: string }[] }
export type Category = 'Questions' | 'Pronouns' | 'Verb forms'
const p = (word: string, role: Role, label: string, note: string, focus = false): Piece => ({word,role,label,note,focus})
const question = (word: string, note: string): Piece => ({...p(word,'question','Question word',note,true), ...(word === 'Who' ? {meaningIcon:'who' as const} : word === 'What' ? {meaningIcon:'what' as const} : {})})
const person = (word: string, note: string, focus = false) => p(word,'person','Pronoun',note,focus)
const det = (word: string): Piece => ({...p(word,'determiner','Determiner',word === 'the' ? 'You know which one I mean. The two people share the same cup in their thought bubble: both know the particular thing being discussed.' : 'One thing, without identifying which one.'), ...(word === 'the' ? {meaningIcon:'the' as const} : {})})
const noun = (word: string): Piece => ({...p(word,'noun','Noun','Names the person or thing in this sentence.'), ...(/^court[?.]?$/i.test(word) ? {meaningIcon:'court' as const} : {})})
const aux = (word: string, note: string) => p(word,'time','Helping verb',note)
const action = (word: string, note: string, focus = false) => p(word,'action','Verb',note,focus)
const whereWhen = [aux('can','Makes this a question about what is possible.'), person('we','The speaker and other people.'), action('play?','The action we are asking about.')]
const whyHow = [aux('do','Helps form the question; it is not the action here.'), person('I','The person speaking.'), action('book','Reserve something.'), det('a'), noun('court?')]
const whoWhat: Piece[] = [
  {...action('is','Here, “is” links someone or something to a location. The person and place are joined; it does not mean moving there.'),meaningIcon:'isLocation'},
  {...p('on','position','Preposition','On the court: on its playing surface. The ball resting on the slab is a memory cue for contact with a surface.'),meaningIcon:'on'},
  det('the'),noun('court?'),
]
export const specimens: Record<Category, Specimen[]> = {
  Questions: [
    {title:'Who / what',caption:'Same sentence. A person or a thing.',rows:[
      {label:'A person',pieces:[question('Who','Asks which person.'),...whoWhat],audio:'padel-questions-1-1-1'},
      {label:'A thing',pieces:[question('What','Asks which thing.'),...whoWhat],audio:'padel-questions-1-1-2'},
    ]},
    {title:'Where / when',caption:'Same action. A place or a time.',rows:[
      {label:'Place',pieces:[question('Where','Asks about a place.'),...whereWhen],audio:'padel-questions-2-3-1'},
      {label:'Time',pieces:[question('When','Asks about a time.'),...whereWhen],audio:'padel-questions-2-3-2'},
    ]},
    {title:'Why / how',caption:'Same action. A reason or a method.',rows:[
      {label:'Reason',pieces:[question('Why','Asks for the reason.'),...whyHow],audio:'padel-questions-3-1-1'},
      {label:'Method',pieces:[question('How','Asks how to do something.'),...whyHow],audio:'padel-questions-3-1-2'},
    ]},
    {title:'How long / how many',caption:'Duration or number. The word order changes too.',rows:[
      {label:'Duration',pieces:[question('How long','Asks for the length of time.'),aux('can','Shows possibility.'),det('the'),noun('players'),action('stay?','Remain here.')],audio:'padel-questions-4-6-1'},
      {label:'Number',pieces:[question('How many','Asks for a count.'),noun('players'),aux('can','Shows possibility.'),action('stay?','Remain here.')],audio:'padel-questions-4-6-2'},
    ]},
  ],
  Pronouns: [
    {title:'She / her',caption:'The same woman. A different role.',rows:[
      {label:'She does the seeing',pieces:[person('She','Subject: the woman who sees.',true),aux('can','Shows ability.'),action('see','The action.'),person('me.','Object: the person she sees.')]},
      {label:'I see her',pieces:[person('I','Subject: the person who sees.'),aux('can','Shows ability.'),action('see','The action.'),person('her.','Object: the woman I see.',true)]},
    ]},
    {title:'They / them',caption:'The same people. A different role.',rows:[
      {label:'They do the helping',pieces:[person('They','Subject: the people who help.',true),aux('can','Shows ability.'),action('help','The action.'),person('us.','Object: the people receiving help.')]},
      {label:'We help them',pieces:[person('We','Subject: the people who help.'),aux('can','Shows ability.'),action('help','The action.'),person('them.','Object: the people receiving help.',true)]},
    ]},
  ],
  'Verb forms': [
    {title:'Plays / is playing',caption:'A regular activity or an action in progress.',rows:[
      {label:'Regularly',pieces:[person('She','The person doing the action.'),action('plays','A regular activity. With “she”, play becomes plays.',true),noun('padel.')]},
      {label:'In progress',pieces:[person('She','The same person.'),{...aux('is','“Is” + playing shows the action is in progress.'),focus:true},action('playing','The -ing form works with “is” here.',true),noun('padel.')]},
    ]},
    {title:'Played / will play',caption:'A past event or a future action.',rows:[
      {label:'Past',pieces:[person('She','The person doing the action.'),action('played','The -ed form places the action in the past.',true),noun('padel.')]},
      {label:'Future',pieces:[person('She','The same person.'),{...aux('will','“Will” + the base verb points to a future action.'),focus:true},action('play','Use the base form after “will”.',true),noun('padel.')]},
    ]},
  ],
}

// Meaning choices belong to this visual prototype only, not the course bank.
export const translations: Record<string, readonly [string, string]> = {
  'Who / what': ['ใครอยู่ในสนาม', 'อะไรอยู่ในสนาม'],
  'Where / when': ['เราเล่นที่ไหนได้', 'เราเล่นเมื่อไหร่ได้'],
  'Why / how': ['ทำไมฉันต้องจองสนาม', 'ฉันจองสนามอย่างไร'],
  'How long / how many': ['ผู้เล่นอยู่ได้นานเท่าไหร่', 'ผู้เล่นอยู่ได้กี่คน'],
  'She / her': ['เธอเห็นฉันได้', 'ฉันเห็นเธอได้'],
  'They / them': ['พวกเขาช่วยพวกเราได้', 'พวกเราช่วยพวกเขาได้'],
  'Plays / is playing': ['เธอเล่นพาเดลเป็นประจำ', 'เธอกำลังเล่นพาเดล'],
  'Played / will play': ['เธอเล่นพาเดลมาแล้ว', 'เธอจะเล่นพาเดล'],
}

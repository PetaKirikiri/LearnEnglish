// Observation examples, not scored questions. Keep one small world stable so
// learners can inspect what English changes to express a different meaning.
// **...** marks the part to notice; it is not a missing-word exercise.
export type BirdSentence = { meaning: string; english: string; thai: string }
export type BirdStructure = { nodeId: string; title: string; sentences: BirdSentence[] }
const row = (meaning: string, english: string, thai: string): BirdSentence => ({meaning,english,thai})
export const birdStructures: BirdStructure[] = [
  {nodeId:'meeting-names',title:'Naming the bird',sentences:[
    row('Its name','The bird’s name **is Pip**.','นกตัวนี้ชื่อพิพ'),
    row('Asking its name','**What is** the bird’s name?','นกตัวนี้ชื่ออะไร'),
  ]},
  {nodeId:'meeting-origins',title:'Where the bird comes from',sentences:[
    row('Origin','The bird **is from** Thailand.','นกตัวนี้มาจากประเทศไทย'),
    row('Asking its origin','**Where is** the bird **from**?','นกตัวนี้มาจากไหน'),
  ]},
  {nodeId:'meeting-people',title:'Identifying the bird',sentences:[
    row('What it is','**This is** a bird.','นี่คือนก'),
    row('Asking what it is','**What is this**?','นี่คืออะไร'),
    row('Checking','**Is this** a bird?','นี่คือนกใช่ไหม'),
  ]},
  {nodeId:'meeting-belongings',title:'Whose seed it is',sentences:[
    row('Belonging','This is **the bird’s** seed.','นี่คือเมล็ดพืชของนกตัวนี้'),
    row('Asking who owns it','**Whose** seed is this?','นี่คือเมล็ดพืชของใคร'),
  ]},
  {nodeId:'first-actions',title:'Watching the bird eat',sentences:[
    row('One bird','The bird **is eating** the seed.','นกตัวนี้กำลังกินเมล็ดพืช'),
    row('More than one','The bird**s are eating** the seeds.','นกหลายตัวกำลังกินเมล็ดพืช'),
  ]},
  {nodeId:'first-negatives',title:'Eating—or not eating',sentences:[
    row('Happening','The bird **is eating** the seed.','นกตัวนี้กำลังกินเมล็ดพืช'),
    row('Not happening','The bird **is not eating** the seed.','นกตัวนี้ไม่ได้กำลังกินเมล็ดพืช'),
  ]},
  {nodeId:'be-forms',title:'Describing its state',sentences:[
    row('A statement','The bird **is** hungry.','นกตัวนี้หิว'),
    row('A question','**Is** the bird hungry?','นกตัวนี้หิวไหม'),
    row('A negative','The bird **is not** hungry.','นกตัวนี้ไม่หิว'),
  ]},
  {nodeId:'ownership',title:'Replacing the owner’s name',sentences:[
    row('Name the owner','The seed is **the bird’s**.','เมล็ดพืชเป็นของนกตัวนี้'),
    row('Refer to the male bird','The seed is **his**.','เมล็ดพืชเป็นของนกตัวผู้ตัวนั้น'),
    row('Before the thing','This is **his seed**.','นี่คือเมล็ดพืชของนกตัวผู้ตัวนั้น'),
  ]},
  {nodeId:'reference',title:'Which bird—and how many',sentences:[
    row('One nearby','**This bird is** eating the seed.','นกตัวนี้กำลังกินเมล็ดพืช'),
    row('One farther away','**That bird is** eating the seed.','นกตัวนั้นกำลังกินเมล็ดพืช'),
    row('Several nearby','**These birds are** eating the seeds.','นกเหล่านี้กำลังกินเมล็ดพืช'),
    row('Several farther away','**Those birds are** eating the seeds.','นกเหล่านั้นกำลังกินเมล็ดพืช'),
  ]},
  {nodeId:'time-place',title:'Where the bird is',sentences:[
    row('Above','The bird is **above** the seed.','นกตัวนี้อยู่เหนือเมล็ดพืช'),
    row('Beside','The bird is **beside** the seed.','นกตัวนี้อยู่ข้างเมล็ดพืช'),
    row('Ask where','**Where is** the bird?','นกตัวนี้อยู่ที่ไหน'),
  ]},
  {nodeId:'routine-now',title:'Usually—or right now',sentences:[
    row('A habit','The bird **eats** seeds.','นกตัวนี้กินเมล็ดพืชเป็นปกติ'),
    row('In progress','The bird **is eating** seeds.','นกตัวนี้กำลังกินเมล็ดพืช'),
  ]},
  {nodeId:'negation',title:'Changing a habit into a negative',sentences:[
    row('What it does','The bird **eats** seeds.','นกตัวนี้กินเมล็ดพืชเป็นปกติ'),
    row('What it does not do','The bird **does not eat** seeds.','นกตัวนี้ไม่กินเมล็ดพืช'),
  ]},
  {nodeId:'past-state',title:'Its state now and before',sentences:[
    row('Now','The bird **is** hungry.','ตอนนี้นกตัวนี้หิว'),
    row('Then','The bird **was** hungry.','ตอนนั้นนกตัวนี้หิว'),
    row('Not then','The bird **was not** hungry.','ตอนนั้นนกตัวนี้ไม่หิว'),
  ]},
  {nodeId:'past-events',title:'An action in the past',sentences:[
    row('Happened','The bird **ate** the seed.','นกตัวนี้กินเมล็ดพืชไปแล้ว'),
    row('Did not happen','The bird **did not eat** the seed.','นกตัวนี้ไม่ได้กินเมล็ดพืช'),
  ]},
  {nodeId:'participants',title:'Who acts—and who receives',sentences:[
    row('The male bird acts','**He** sees **her**.','นกตัวผู้เห็นนกตัวเมีย'),
    row('The female bird acts','**She** sees **him**.','นกตัวเมียเห็นนกตัวผู้'),
    row('The thing it eats','The bird eats **the seed**.','นกตัวนี้กินเมล็ดพืช'),
    row('Refer to that same seed','The bird eats **it**.','นกตัวนี้กินมัน โดยมันหมายถึงเมล็ดพืช'),
  ]},
  {nodeId:'questions',title:'Asking about the same action',sentences:[
    row('A habit?','**Does** the bird **eat** seeds?','นกตัวนี้กินเมล็ดพืชเป็นปกติไหม'),
    row('Happening now?','**Is** the bird **eating** the seed?','นกตัวนี้กำลังกินเมล็ดพืชอยู่ไหม'),
    row('Happened before?','**Did** the bird **eat** the seed?','นกตัวนี้ได้กินเมล็ดพืชไปไหม'),
    row('Ask about the thing','**What** is the bird eating?','นกตัวนี้กำลังกินอะไร'),
  ]},
  {nodeId:'request-basics',title:'Asking permission or asking for help',sentences:[
    row('Permission for me','Can **I** feed the bird?','ฉันขอให้อาหารนกได้ไหม'),
    row('Help from you','Can **you** feed the bird?','คุณช่วยให้อาหารนกได้ไหม'),
    row('An instruction','**Feed** the bird.','ให้อาหารนก'),
    row('A negative instruction','**Do not feed** the bird.','อย่าให้อาหารนก'),
  ]},
  {nodeId:'simple-links',title:'Joining two observations',sentences:[
    row('Add','The bird is hungry **and** it is eating.','นกหิวและกำลังกิน'),
    row('Contrast','The bird is hungry **but** it is not eating.','นกหิวแต่ไม่ได้กำลังกิน'),
    row('Explain','The bird is eating **because** it is hungry.','นกกำลังกินเพราะมันหิว'),
  ]},
  {nodeId:'future',title:'Looking ahead',sentences:[
    row('A prediction','The bird **will eat** the seed.','นกตัวนี้จะกินเมล็ดพืช'),
    row('Expecting it from what we see','The bird **is going to eat** the seed.','ดูแล้วนกตัวนี้กำลังจะกินเมล็ดพืช'),
    row('A negative prediction','The bird **will not eat** the seed.','นกตัวนี้จะไม่กินเมล็ดพืช'),
  ]},
  {nodeId:'obligation',title:'Able, required, or advised',sentences:[
    row('Ability','The bird **can eat** the seed.','นกตัวนี้กินเมล็ดพืชได้'),
    row('Unable','The bird **cannot eat** the seed.','นกตัวนี้กินเมล็ดพืชไม่ได้'),
    row('Necessary','The bird **must eat** the seed.','นกตัวนี้ต้องกินเมล็ดพืช'),
    row('Advisable','The bird **should eat** the seed.','นกตัวนี้ควรกินเมล็ดพืช'),
  ]},
  {nodeId:'quantity',title:'How much food is there?',sentences:[
    row('Count the seeds','**How many seeds** does the bird have?','นกตัวนี้มีเมล็ดพืชกี่เมล็ด'),
    row('Amount of food','**How much food** does the bird have?','นกตัวนี้มีอาหารมากแค่ไหน'),
    row('Some','The bird has **a few** seeds.','นกตัวนี้มีเมล็ดพืชอยู่บ้าง'),
    row('Hardly any','The bird has **few** seeds.','นกตัวนี้มีเมล็ดพืชน้อยมาก'),
  ]},
  {nodeId:'comparison',title:'Comparing the same two birds',sentences:[
    row('One direction','This bird is **bigger than** that bird.','นกตัวนี้ใหญ่กว่านกตัวนั้น'),
    row('The other direction','That bird is **smaller than** this bird.','นกตัวนั้นเล็กกว่านกตัวนี้'),
    row('Equal','This bird is **as big as** that bird.','นกตัวนี้ใหญ่เท่ากับนกตัวนั้น'),
  ]},
  {nodeId:'sequence',title:'Which action comes first?',sentences:[
    row('Eating first','The bird eats the seed **before** it flies away.','นกกินเมล็ดพืชก่อนบินจากไป'),
    row('Flying first','The bird eats the seed **after** it flies away.','นกกินเมล็ดพืชหลังบินจากไป'),
  ]},
  {nodeId:'completion',title:'In progress, completed, or not yet',sentences:[
    row('In progress','The bird **is eating** the seed.','นกตัวนี้กำลังกินเมล็ดพืช'),
    row('Completed','The bird **has eaten** the seed.','นกตัวนี้กินเมล็ดพืชไปแล้ว'),
    row('Not yet','The bird **has not eaten** the seed **yet**.','นกตัวนี้ยังไม่ได้กินเมล็ดพืช'),
    row('Already?','**Has** the bird **eaten** the seed **yet**?','นกตัวนี้กินเมล็ดพืชแล้วหรือยัง'),
  ]},
  {nodeId:'past-sequence',title:'At the moment I arrived',sentences:[
    row('In progress then','When I arrived, the bird **was eating** the seed.','ตอนฉันมาถึง นกกำลังกินเมล็ดพืช'),
    row('Finished before then','When I arrived, the bird **had eaten** the seed.','ตอนฉันมาถึง นกกินเมล็ดพืชไปก่อนแล้ว'),
  ]},
  {nodeId:'verb-shapes',title:'The helper changes the verb’s form',sentences:[
    row('Possible action','The bird can **eat** the seed.','นกตัวนี้กินเมล็ดพืชได้'),
    row('Action in progress','The bird is **eating** the seed.','นกตัวนี้กำลังกินเมล็ดพืช'),
    row('Completed action','The bird has **eaten** the seed.','นกตัวนี้กินเมล็ดพืชไปแล้ว'),
  ]},
  {nodeId:'verb-complements',title:'Wanting to do it—or wanting someone else to',sentences:[
    row('The bird will do it','The bird wants **to eat** the seed.','นกตัวนี้อยากกินเมล็ดพืชเอง'),
    row('The bird wants me to do it','The bird wants **me to eat** the seed.','นกตัวนี้อยากให้ฉันกินเมล็ดพืช'),
  ]},
  {nodeId:'passive',title:'Looking from the other side',sentences:[
    row('Start with the bird','**The bird ate** the seed.','นกตัวนี้กินเมล็ดพืชไปแล้ว'),
    row('Start with the seed','**The seed was eaten by** the bird.','เมล็ดพืชถูกนกตัวนี้กินไปแล้ว'),
    row('Leave the eater unnamed','The seed **was eaten**.','เมล็ดพืชถูกกินไปแล้ว'),
  ]},
  {nodeId:'repair',title:'Asking directly or indirectly',sentences:[
    row('Direct','**Where is the bird**?','นกอยู่ที่ไหน'),
    row('Indirect','Could you tell me **where the bird is**?','ช่วยบอกหน่อยได้ไหมว่านกอยู่ที่ไหน'),
    row('Checking an action','Could you tell me **whether the bird has eaten**?','ช่วยบอกหน่อยได้ไหมว่านกกินแล้วหรือยัง'),
  ]},
  {nodeId:'possibility',title:'How certain are we?',sentences:[
    row('Possible','The bird **may be eating** the seed.','นกอาจกำลังกินเมล็ดพืช'),
    row('Strong conclusion','The bird **must be eating** the seed.','นกคงกำลังกินเมล็ดพืชแน่ ๆ'),
    row('Rule it out','The bird **cannot be eating** the seed.','เป็นไปไม่ได้ที่นกกำลังกินเมล็ดพืช'),
  ]},
  {nodeId:'hypothetical',title:'A real possibility or an imagined one',sentences:[
    row('Open possibility','If the bird **is** hungry, it **will eat** the seed.','ถ้านกหิว มันจะกินเมล็ดพืช'),
    row('Imagined situation','If the bird **were** hungry, it **would eat** the seed.','สมมติว่านกหิว มันก็คงกินเมล็ดพืช'),
  ]},
  {nodeId:'nuance',title:'Looking back: possible or advisable',sentences:[
    row('Possibly happened','The bird **may have eaten** the seed.','นกอาจกินเมล็ดพืชไปแล้ว'),
    row('Would have been advisable','The bird **should have eaten** the seed.','นกควรจะกินเมล็ดพืชไปแล้ว'),
  ]},
  {nodeId:'reported',title:'Passing on someone’s words',sentences:[
    row('Original words','She said, “The bird **will eat** the seed.”','เธอพูดว่า “นกจะกินเมล็ดพืช”'),
    row('Retelling','She said that the bird **would eat** the seed.','เธอบอกว่านกจะกินเมล็ดพืช โดยจะกินหลังเวลาที่เธอพูด'),
    row('Completed before she spoke','She said that the bird **had eaten** the seed.','เธอบอกว่านกกินเมล็ดพืชไปก่อนที่เธอจะพูดแล้ว'),
  ]},
  {nodeId:'relative',title:'Identifying the bird through its action',sentences:[
    row('A separate fact','The bird **ate the seed**.','นกตัวนี้กินเมล็ดพืชไปแล้ว'),
    row('Identify which bird','The bird **that ate the seed** is here.','นกตัวที่กินเมล็ดพืชอยู่ที่นี่'),
    row('Identify which seed','The seed **that the bird ate** was small.','เมล็ดพืชที่นกกินมีขนาดเล็ก'),
  ]},
  {nodeId:'future-completion',title:'At the moment I return',sentences:[
    row('In progress then','When I return, the bird **will be eating** the seed.','ตอนฉันกลับมา นกจะกำลังกินเมล็ดพืช'),
    row('Finished by then','When I return, the bird **will have eaten** the seed.','ตอนฉันกลับมา นกจะกินเมล็ดพืชเสร็จไปแล้ว'),
  ]},
  {nodeId:'counterfactual',title:'Imagining a different past',sentences:[
    row('A different past result','If the bird **had eaten** the seed, it **would not have been** hungry.','ถ้าตอนนั้นนกได้กินเมล็ดพืช มันก็คงไม่หิวในตอนนั้น'),
    row('A different result now','If the bird **had eaten** the seed, it **would not be** hungry now.','ถ้าตอนนั้นนกได้กินเมล็ดพืช ตอนนี้มันก็คงไม่หิว'),
  ]},
  {nodeId:'qualification',title:'A reason—or something unexpected',sentences:[
    row('A reason','**Because** the bird was hungry, it ate the seed.','เพราะนกหิว มันจึงกินเมล็ดพืช'),
    row('Against expectation','**Although** the bird was hungry, it did not eat the seed.','แม้ว่านกจะหิว แต่มันก็ไม่ได้กินเมล็ดพืช'),
  ]},
  {nodeId:'professional-response',title:'An option now or an option in the past',sentences:[
    row('Available now','The bird **can eat** the seed.','ตอนนี้นกกินเมล็ดพืชได้'),
    row('Was available then','The bird **could have eaten** the seed, but it did not.','ตอนนั้นนกกินเมล็ดพืชได้ แต่มันไม่ได้กิน'),
  ]},
  {nodeId:'complex-time',title:'Keeping track of several events',sentences:[
    row('Eating was already finished','When I returned, the bird **had eaten** the seed that I had left.','ตอนฉันกลับมา นกกินเมล็ดพืชที่ฉันเคยวางไว้ไปแล้ว'),
    row('Eating was still happening','When I returned, the bird **was eating** the seed that I had left.','ตอนฉันกลับมา นกกำลังกินเมล็ดพืชที่ฉันเคยวางไว้'),
  ]},
]

export const plainBirdSentence = (text: string) => text.replaceAll('**','')

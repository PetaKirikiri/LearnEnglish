import {birdStructures,plainBirdSentence,type BirdSentence} from './birdStructures'

type Line = readonly [english:string,thai:string]
// Authored prompts: never mechanically turn a statement into a question.
// A single prompt may be reused for separate possible replies, not as one
// conversation in which the bird both did and did not eat the same seed.
const prompts:Record<string,readonly Line[]>={
  'meeting-names':[['**What is** the bird’s name?','นกตัวนี้ชื่ออะไร']],
  'meeting-origins':[['**Where is** the bird **from**?','นกตัวนี้มาจากไหน']],
  'meeting-people':[['**What is** this?','นี่คืออะไร']],
  'meeting-belongings':[['**Whose** seed is this?','นี่คือเมล็ดพืชของใคร']],
  'first-actions':[['What **is** the bird **doing**?','นกตัวนี้กำลังทำอะไร'],['What **are** the birds **doing**?','นกหลายตัวกำลังทำอะไร']],
  'first-negatives':[['**Is** the bird **eating** the seed?','นกตัวนี้กำลังกินเมล็ดพืชอยู่ไหม']],
  'be-forms':[['**Is** the bird hungry?','นกตัวนี้หิวไหม']],
  'ownership':[['**Whose** seed is it?','เมล็ดพืชนี้เป็นของใคร']],
  'reference':[['**Which bird** is eating the seed?','นกตัวไหนกำลังกินเมล็ดพืช'],['**Which bird** is eating the seed?','นกตัวไหนกำลังกินเมล็ดพืช'],['**Which birds** are eating the seeds?','นกพวกไหนกำลังกินเมล็ดพืช'],['**Which birds** are eating the seeds?','นกพวกไหนกำลังกินเมล็ดพืช']],
  'time-place':[['**Where is** the bird?','นกตัวนี้อยู่ที่ไหน']],
  'routine-now':[['What **does** the bird **eat**?','นกตัวนี้กินอะไรเป็นปกติ'],['What **is** the bird **doing**?','นกตัวนี้กำลังทำอะไร']],
  'negation':[['**Does** the bird **eat** seeds?','นกตัวนี้กินเมล็ดพืชไหม']],
  'past-state':[['**Is** the bird hungry?','ตอนนี้นกตัวนี้หิวไหม'],['**Was** the bird hungry?','ตอนนั้นนกตัวนี้หิวไหม'],['**Was** the bird hungry?','ตอนนั้นนกตัวนี้หิวไหม']],
  'past-events':[['**Did** the bird **eat** the seed?','นกตัวนี้ได้กินเมล็ดพืชไปไหม']],
  'participants':[['**Who** sees **her**?','ใครเห็นนกตัวเมีย'],['**Who** sees **him**?','ใครเห็นนกตัวผู้'],['**What** does the bird eat?','นกตัวนี้กินอะไร'],['Does the bird eat **the seed**?','นกตัวนี้กินเมล็ดพืชไหม']],
  'questions':[],
  'request-basics':[['Can **I** feed the bird?','ฉันขอให้อาหารนกได้ไหม'],['Can **you** feed the bird?','คุณช่วยให้อาหารนกได้ไหม'],['**What should I do**?','ฉันควรทำอะไร'],['**What should I avoid doing**?','ฉันควรหลีกเลี่ยงการทำอะไร']],
  'simple-links':[['Is the bird hungry? **Is it eating**?','นกหิวไหม แล้วกำลังกินอยู่ไหม'],['Is the bird hungry? **Is it eating**?','นกหิวไหม แล้วกำลังกินอยู่ไหม'],['**Why** is the bird eating?','ทำไมนกกำลังกิน']],
  'future':[['What **will** the bird **do**?','นกจะทำอะไร'],['Look at the bird. What **is it going to do**?','ดูนกสิ มันกำลังจะทำอะไร'],['**Will** the bird **eat** the seed?','นกจะกินเมล็ดพืชไหม']],
  'obligation':[['**Can** the bird **eat** the seed?','นกกินเมล็ดพืชได้ไหม'],['**Can** the bird **eat** the seed?','นกกินเมล็ดพืชได้ไหม'],['What **must** the bird **do**?','นกต้องทำอะไร'],['What **should** the bird **do**?','นกควรทำอะไร']],
  'quantity':[['**How many seeds** does the bird have?','นกมีเมล็ดพืชกี่เมล็ด'],['**How much food** does the bird have?','นกมีอาหารมากแค่ไหน'],['**Does** the bird **have any** seeds?','นกมีเมล็ดพืชบ้างไหม'],['**Does** the bird **have many** seeds?','นกมีเมล็ดพืชมากไหม']],
  'comparison':[['**How does** this bird **compare with** that bird?','นกตัวนี้เป็นอย่างไรเมื่อเทียบกับนกตัวนั้น'],['**How does** that bird **compare with** this bird?','นกตัวนั้นเป็นอย่างไรเมื่อเทียบกับนกตัวนี้'],['**Are** the birds **the same size**?','นกสองตัวมีขนาดเท่ากันไหม']],
  'sequence':[['**When does** the bird eat the seed?','นกกินเมล็ดพืชเมื่อไหร่']],
  'completion':[['**What is** the bird **doing**?','นกกำลังทำอะไร'],['**Has** the bird **eaten** the seed **yet**?','นกกินเมล็ดพืชแล้วหรือยัง'],['**Has** the bird **eaten** the seed **yet**?','นกกินเมล็ดพืชแล้วหรือยัง']],
  'past-sequence':[['**What was happening** when you arrived?','ตอนคุณมาถึง มีอะไรกำลังเกิดขึ้น'],['**What had happened** before you arrived?','ก่อนคุณมาถึง มีอะไรเกิดขึ้นไปแล้ว']],
  'verb-shapes':[['**Can** the bird **eat** the seed?','นกกินเมล็ดพืชได้ไหม'],['**Is** the bird **eating** the seed?','นกกำลังกินเมล็ดพืชไหม'],['**Has** the bird **eaten** the seed?','นกกินเมล็ดพืชไปแล้วไหม']],
  'verb-complements':[['What **does** the bird **want**?','นกต้องการอะไร']],
  'passive':[['**What did** the bird **do**?','นกทำอะไรไป'],['**What happened to** the seed?','เกิดอะไรขึ้นกับเมล็ดพืช'],['**What happened to** the seed?','เกิดอะไรขึ้นกับเมล็ดพืช']],
  'repair':[],
  'possibility':[['**Do you think** the bird is eating the seed?','คุณคิดว่านกกำลังกินเมล็ดพืชไหม']],
  'hypothetical':[['What **will happen if** the bird is hungry?','จะเกิดอะไรขึ้นถ้านกหิว'],['What **would happen if** the bird were hungry?','สมมติว่านกหิว จะเกิดอะไรขึ้น']],
  'nuance':[['**Could** the bird **have eaten** the seed?','เป็นไปได้ไหมว่านกกินเมล็ดพืชไปแล้ว'],['What **should** the bird **have done**?','นกควรจะทำอะไรไปแล้ว']],
  'reported':[['**What exactly did she say**?','เธอพูดว่าอะไรบ้างแบบตรงตามคำพูด'],['**What did she say** the bird would do?','เธอบอกว่านกจะทำอะไร'],['**What did she say** the bird had done?','เธอบอกว่านกทำอะไรไปแล้ว']],
  'relative':[['**What did** the bird **do**?','นกทำอะไรไป'],['**Which bird** is here?','นกตัวไหนอยู่ที่นี่'],['**Which seed** was small?','เมล็ดพืชเมล็ดไหนมีขนาดเล็ก']],
  'future-completion':[['What **will** the bird **be doing** when you return?','ตอนคุณกลับมา นกจะกำลังทำอะไร'],['What **will** the bird **have done** by the time you return?','เมื่อถึงเวลาที่คุณกลับมา นกจะทำอะไรเสร็จไปแล้ว']],
  'counterfactual':[['**Would** the bird **have been** hungry then if it **had eaten** the seed?','ถ้าตอนนั้นนกได้กินเมล็ดพืช มันจะยังหิวในตอนนั้นไหม'],['**Would** the bird **be** hungry now if it **had eaten** the seed?','ถ้าตอนนั้นนกได้กินเมล็ดพืช ตอนนี้มันจะยังหิวไหม']],
  'qualification':[['**Why did** the bird eat the seed?','ทำไมนกจึงกินเมล็ดพืช'],['The bird was hungry. **Did it eat** the seed?','นกหิว แล้วมันได้กินเมล็ดพืชไหม']],
  'professional-response':[['What **can** the bird **do now**?','ตอนนี้นกทำอะไรได้'],['What **could** the bird **have done instead**?','ตอนนั้นนกทำอะไรแทนได้บ้าง']],
  'complex-time':[['**What had happened** by the time you returned?','เมื่อคุณกลับมา มีอะไรเกิดขึ้นไปแล้ว'],['**What was happening** when you returned?','ตอนคุณกลับมา มีอะไรกำลังเกิดขึ้น']],
}

// Where the original observation was itself a question, supply a genuine
// answer rather than putting another question in the reply bubble.
const replies:Record<string,Record<number,Line>>={
  'meeting-names':{1:['The bird’s name **is Pip**.','นกตัวนี้ชื่อพิพ']},
  'meeting-origins':{1:['The bird **is from Thailand**.','นกตัวนี้มาจากประเทศไทย']},
  'meeting-people':{1:['**This is a bird**.','นี่คือนก'],2:['**Yes**, this **is** a bird.','ใช่ นี่คือนก']},
  'meeting-belongings':{1:['It is **the bird’s** seed.','มันคือเมล็ดพืชของนกตัวนี้']},
  'be-forms':{1:['**Yes**, the bird **is** hungry.','ใช่ นกตัวนี้หิว']},
  'time-place':{2:['The bird is **beside the seed**.','นกตัวนี้อยู่ข้างเมล็ดพืช']},
  'questions':{
    0:['**Yes**, the bird **eats** seeds.','ใช่ นกตัวนี้กินเมล็ดพืชเป็นปกติ'],
    1:['**Yes**, the bird **is eating** the seed.','ใช่ นกตัวนี้กำลังกินเมล็ดพืช'],
    2:['**Yes**, the bird **ate** the seed.','ใช่ นกตัวนี้กินเมล็ดพืชไปแล้ว'],
    3:['The bird is eating **the seed**.','นกตัวนี้กำลังกินเมล็ดพืช'],
  },
  'request-basics':{0:['Yes, **you can** feed the bird.','ได้ คุณให้อาหารนกได้'],1:['Yes, **I can** feed the bird.','ได้ ฉันช่วยให้อาหารนกได้']},
  'quantity':{0:['The bird has **three seeds**.','นกมีเมล็ดพืชสามเมล็ด'],1:['The bird has **a little food**.','นกมีอาหารเล็กน้อย']},
  'completion':{3:['**Yes**, the bird **has eaten** the seed.','ใช่ นกกินเมล็ดพืชไปแล้ว']},
  'repair':{0:['The bird **is beside the seed**.','นกอยู่ข้างเมล็ดพืช'],1:['The bird **is beside the seed**.','นกอยู่ข้างเมล็ดพืช'],2:['Yes, the bird **has eaten**.','ได้ นกกินไปแล้ว']},
}

export function birdDialogue(nodeId:string,sentence:BirdSentence,index:number) {
  const isQuestion=plainBirdSentence(sentence.english).endsWith('?')
  const reply=replies[nodeId]?.[index]
  const prompt=prompts[nodeId]?.[index]??prompts[nodeId]?.[0]
  if(isQuestion&&!reply) throw new Error(`Missing bird reply: ${nodeId}/${index}`)
  if(!isQuestion&&!prompt) throw new Error(`Missing bird prompt: ${nodeId}/${index}`)
  return {
    question:isQuestion?{english:sentence.english,thai:sentence.thai}:{english:prompt[0],thai:prompt[1]},
    answer:isQuestion?{english:reply[0],thai:reply[1]}:{english:sentence.english,thai:sentence.thai},
  }
}

// These authored rows become the same exchange once presented as Q&A.
// Keep one observation per distinction, not separate entries for incidental
// "This is" / "It is", a prefixed "Yes", or moving the question into its own row.
// Explicit review avoids collapsing real pronoun, polarity, or time contrasts.
const combinedRows:Record<string,readonly number[]>={
  'meeting-belongings':[1],
  'be-forms':[1],
  'time-place':[2],
  'completion':[3],
}

export const birdDialogues=birdStructures.map(group=>{
  const seen=new Set<string>()
  const dialogues=group.sentences.flatMap((sentence,index)=>combinedRows[group.nodeId]?.includes(index)?[]:[{...birdDialogue(group.nodeId,sentence,index),meaning:sentence.meaning}])
    .filter(dialogue=>{
      const key=plainBirdSentence(dialogue.question.english)+'|'+plainBirdSentence(dialogue.answer.english)
      if(seen.has(key)) return false
      seen.add(key);return true
    })
  return {...group,dialogues}
})

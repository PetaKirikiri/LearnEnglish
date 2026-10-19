import { buildCurriculumSeed } from './seed'
import { contrasts, expandedQuestions } from './expandedContent'
import { curriculumSchema, type Curriculum } from './schema'
import { hotelWordGlosses } from '../hotel/wordGlosses'
import { newGlosses } from './newGlosses'
import { generalQuestions, generalPairs } from './generalContent'
import { generalGlosses, courseMeaningOverrides } from './generalGlosses'

// Frames are teaching templates, not a copied external word/grammar inventory.
const existing:Record<string,{frames:string[];focus:string[]}>={
  participants:{frames:['[subject pronoun] [verb] [object pronoun]','[subject] gave [person] [thing]','[subject] asked [object pronoun] to [verb]'],focus:['i','me','she','her','he','him','we','us','they','them']},
  'be-forms':{frames:['I am [state]','He / she / it is [state]','You / we / they are [state]'],focus:['am','is','are']},
  reference:{frames:['a / an [singular noun]','this / these [noun]'],focus:['a','an','this','these']},
  ownership:{frames:['my / her / their [noun]','[noun] is mine / hers / theirs'],focus:['my','mine','her','hers','their','theirs','our','ours','your','yours']},
  'routine-now':{frames:['[subject] [present verb] [object]','[subject] am / is / are [verb-ing] [object]'],focus:['am','is','are']},
  'past-state':{frames:['[subject] is / are [state]','[subject] was / were [state]'],focus:['am','is','are','was','were']},
  negation:{frames:['[subject] is not [state]','[subject] cannot [verb]','[subject] do / does not [base verb]','[subject] has not [participle]'],focus:['not','cannot','do','does','has']},
  questions:{frames:['Do / does [subject] [base verb]?','Did [subject] [base verb]?'],focus:['do','does','did']},
  'time-place':{frames:['[event] before / after [event]','[movement] to / from [place]','[thing] is beside / opposite [thing]','[thing] is in front of / behind [thing]'],focus:['before','after','to','from','beside','opposite','in','front','of','behind']},
  future:{frames:['[subject] will [base verb]','[subject] am / is / are [verb-ing]'],focus:['will','am','is','are']},
  completion:{frames:['[subject] am / is / are [verb-ing]','[subject] have / has [participle]'],focus:['am','is','are','have','has']},
  'verb-shapes':{frames:['[subject] will / can [base verb]','[subject] have / has [participle]','[subject] am / is / are [verb-ing]','[subject] [past verb] [object]','[subject] [present verb] [object]'],focus:['have','has','will','can','are']},
  obligation:{frames:['You can [base verb]','You must [base verb]'],focus:['can','must']},
  'verb-complements':{frames:['ask / tell [person] to [verb]','let [person] [base verb]','explain [thing] to [person]','wait for [person]','Would you like [person] to [verb]?','look forward to [verb-ing]'],focus:['to','let','asked','tell','for','like','forward']},
  passive:{frames:['[doer] [past verb] [receiver]','[receiver] was / were [participle] by [doer]'],focus:['was','were','by']},
}
export const tokenize=(text:string)=>text.toLowerCase().match(/[a-z]+(?:'[a-z]+)*/g)??[]
export function buildSyllabus(dictionary:Record<string,string>={}):Curriculum {
  const base=buildCurriculumSeed()
  const questions=[...base.questions,...expandedQuestions().map(q=>({...q,grammar:q.grammar!})),...generalQuestions().map(q=>({...q,grammar:q.grammar!}))]
  const courseSkills=[...base.courseSkills,...contrasts.map(c=>({course:'hotel' as const,skill:`route_${c.node.replaceAll('-','_')}`,nodeId:c.node,order:0}))]
    .sort((a,b)=>base.skills.find(s=>s.id===a.nodeId)!.order-base.skills.find(s=>s.id===b.nodeId)!.order)
    .map((s,order)=>({...s,order}))
  const structures=base.skills.map(node=>{
    const spec=existing[node.id]??contrasts.find(c=>c.node===node.id)!
    const groups=courseSkills.filter(s=>s.nodeId===node.id).map(s=>s.skill)
    const items=questions.filter(q=>groups.includes(q.skill))
    const extra=generalPairs.filter(p=>p.node===node.id)
    return {id:`structure-${node.id}`,nodeId:node.id,frames:[...new Set([...spec.frames,...extra.flatMap(p=>p.frames)])],focusWords:[...new Set([...spec.focus,...extra.flatMap(p=>p.focus)])],
      questionIds:items.map(q=>q.id),vocabulary:[...new Set(items.flatMap(q=>tokenize(q.english)))].sort(),coverage:'introductory' as const}
  })
  const grammarWords=new Set(structures.flatMap(s=>s.focusWords))
  const words=[...new Set(structures.flatMap(s=>s.vocabulary))]
  const vocabulary=words.map(word=>{
    const used=structures.filter(s=>s.vocabulary.includes(word))
    const thai=courseMeaningOverrides[word]??hotelWordGlosses[word]??newGlosses[word]??dictionary[word]??generalGlosses[word]
    if(!thai) throw new Error(`Missing reviewed Thai meaning: ${word}`)
    return {word,thai,firstNodeId:used[0].nodeId,structureIds:used.map(s=>s.id),role:grammarWords.has(word)?'grammar' as const:'support' as const}
  })
  const wordLinks=questions.flatMap(q=>[...new Set(tokenize(q.english))].map(word=>({questionId:q.id,word,role:q.grammar.targets.includes(word)?'target' as const:'context' as const})))
  return curriculumSchema.parse({...base,version:2,revision:'2026-10-19.3',courseSkills,questions,structures,vocabulary,wordLinks})
}

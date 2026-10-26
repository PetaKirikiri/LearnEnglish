import {birdDialogues} from './birdDialogues'
import {plainBirdSentence} from './birdStructures'
import type {Curriculum} from './schema'

type Purpose='construction'|'variation'|'contrast'|'composition'
type Selection={nodeId:string;meanings?:readonly string[];purpose:Purpose}
const source=(nodeId:string,purpose:Purpose='construction',meanings?:readonly string[]):Selection=>({nodeId,purpose,meanings})

// Presentation families are intentionally independent of syllabus topic IDs.
// A new modifier/topic must not automatically create a new structure card.
// These purposes are authoring metadata, never learner-facing status labels.
export const birdPatternDefinitions=[
  {id:'identity',title:'Naming and identifying',sources:[source('meeting-names'),source('meeting-people')]},
  {id:'origin',title:'Where the bird comes from',sources:[source('meeting-origins')]},
  {id:'possession',title:'Whose it is',sources:[source('meeting-belongings'),source('ownership','variation')]},
  {id:'state',title:'How the bird is feeling',sources:[source('be-forms'),source('past-state','contrast')]},
  {id:'location',title:'Where the bird is',sources:[source('time-place','variation')]},
  {id:'simple-action',title:'Who does what',sources:[source('routine-now','construction',['A habit']),source('negation','contrast'),source('participants','variation'),source('questions','contrast',['A habit?'])]},
  {id:'progressive',title:'What is happening',sources:[source('first-actions'),source('first-negatives','contrast'),source('reference','variation'),source('routine-now','contrast',['In progress']),source('questions','contrast',['Happening now?','Ask about the thing'])]},
  {id:'past-action',title:'What happened',sources:[source('past-events'),source('questions','contrast',['Happened before?'])]},
  {id:'modal-action',title:'What can, must or should happen',sources:[source('obligation'),source('request-basics','variation',['Permission for me','Help from you']),source('professional-response','variation',['Available now'])]},
  {id:'instructions',title:'Telling someone what to do',sources:[source('request-basics','construction',['An instruction','A negative instruction'])]},
  {id:'future-action',title:'What will happen',sources:[source('future')]},
  {id:'having',title:'What the bird has',sources:[source('quantity','variation')]},
  {id:'comparison',title:'Comparing two birds',sources:[source('comparison','variation')]},
  {id:'coordination',title:'Joining observations',sources:[source('simple-links','construction',['Add','Contrast'])]},
  {id:'reason-concession',title:'Giving a reason or showing a contrast',sources:[source('simple-links','construction',['Explain']),source('qualification','contrast')]},
  {id:'time-clauses',title:'Before and after another action',sources:[source('sequence','contrast')]},
  {id:'perfect',title:'What has happened',sources:[source('completion')]},
  {id:'past-timeline',title:'What was happening or had already happened',sources:[source('past-sequence'),source('complex-time','composition')]},
  {id:'verb-complements',title:'Wanting to act or wanting someone else to act',sources:[source('verb-complements')]},
  {id:'voice',title:'Who acted or what was affected',sources:[source('passive')]},
  {id:'embedded-question',title:'Putting a question inside a request',sources:[source('repair')]},
  {id:'modal-progressive',title:'What might be happening',sources:[source('possibility','contrast')]},
  {id:'conditionals',title:'What would happen if things were different',sources:[source('hypothetical'),source('counterfactual','contrast')]},
  {id:'modal-perfect',title:'What might or should have happened',sources:[source('nuance'),source('professional-response','contrast',['Was available then'])]},
  {id:'reported-speech',title:'Reporting what someone said',sources:[source('reported')]},
  {id:'relative-clauses',title:'Identifying something by what happened',sources:[source('relative')]},
  {id:'future-timeline',title:'What will be happening or will already be finished',sources:[source('future-completion')]},
] as const

const sourceGroups=new Map(birdDialogues.map(group=>[group.nodeId,group]))
export const birdPatternFamilies=birdPatternDefinitions.map((family,index)=>({
  id:family.id,title:family.title,number:index+1,
  dialogues:family.sources.flatMap(selection=>{
    const group=sourceGroups.get(selection.nodeId)
    if(!group) throw new Error(`Missing bird pattern source: ${selection.nodeId}`)
    if(selection.meanings?.some(meaning=>!group.dialogues.some(d=>d.meaning===meaning))) throw new Error(`Unknown bird pattern selection: ${selection.nodeId}`)
    return group.dialogues.filter(d=>!selection.meanings||selection.meanings.includes(d.meaning))
      .map(dialogue=>({...dialogue,nodeId:group.nodeId,purpose:selection.purpose,key:`${group.nodeId}:${dialogue.meaning}`}))
  }),
}))

export const birdExchangeKey=(dialogue:{question:{english:string};answer:{english:string}})=>
  [dialogue.question.english,dialogue.answer.english].map(plainBirdSentence).join('\n')

export function visibleBirdPatterns(data:Curriculum,level:string='All') {
  const nodes=new Map(data.skills.map(node=>[node.id,node]))
  const seen=new Set<string>()
  // Filter at example level: a mixed-level family must not expose advanced
  // examples in A1 or hide its advanced examples when B1/B2 is selected.
  // Deduplicate after filtering so a shared baseline is still available in a
  // selected level even if its earlier occurrence belongs to a different one.
  return birdPatternFamilies.map(family=>({...family,dialogues:family.dialogues.filter(dialogue=>{
    const node=nodes.get(dialogue.nodeId)
    if(!node||(level!=='All'&&node.level!==level)) return false
    const key=birdExchangeKey(dialogue)
    if(seen.has(key)) return false
    seen.add(key)
    return true
  })})).filter(family=>family.dialogues.length>0)
}

import {activeActionBlueprints} from './actionBlueprints'
import type {PracticeLevel} from '../../race/PracticeLevelPicker'
import type {PracticeStructure} from '../../race/generatedPracticeContent'
import type {HierarchyType} from '../../race/wordHierarchy'
const requests=new Map<string,ReturnType<typeof createRequest>>()
function createRequest(level:PracticeLevel,structure?:PracticeStructure){
 const construction=structure==='identify'?'identify':structure==='location'?'location':structure==='destination'?'action':level<=3?'noun':level===4?'activity-question':'action'
 const frames=activeActionBlueprints.filter(frame=>structure==='destination'?frame.connection==='to':level===6?frame.connection==='direct':true)
 const anchors:readonly HierarchyType[]=construction==='action'?['noun','verb','adjective','pronoun','determiner']:construction==='activity-question'?['noun','adjective','pronoun','determiner']:construction==='identify'?['noun','determiner']:construction==='location'?['noun','pronoun','determiner']:['noun','adjective','determiner']
 return {construction,frames,anchors,movementOnly:structure==='destination',level,
  subjectGroup:'subjects' as const,
  // Connections/categories come from the existing verb uses; never add a
  // preposition merely because a chosen ingredient cannot fit this blueprint.
  objectPolicy:'verb-frame' as const,agreement:'subject-person-and-noun-number' as const,
 }
}
/** Stable meal orders, cached independently of learner progress. They describe
 * slots and conditions, never sentence permutations or a fixed anchor order. */
export function practiceBlueprintRequest(level:PracticeLevel,structure?:PracticeStructure){
 const key=`${level}:${structure??'default'}`
 let request=requests.get(key)
 if(!request){request=createRequest(level,structure);requests.set(key,request)}
 return request
}

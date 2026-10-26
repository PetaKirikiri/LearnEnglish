import { padelPairs } from './content'

// These are authored teaching stages, not certificates or an exhaustive CEFR
// syllabus. nodeIds refer to the existing shared curriculum catalogue.
// The same map orders the admin table AND gates the learner's scheduler.
type Stage = { id:string; title:string; level:'A1'|'A2'; nodeIds:string[]; lanes:string[][]; prerequisite?:string }
const explicit: Omit<Stage,'prerequisite'>[] = [
  {id:'start',title:'People & court equipment',level:'A1',nodeIds:['reference'],lanes:[['people-1'],['gear-1','gear-net']]},
  {id:'number-owner',title:'One / two · my / your',level:'A1',nodeIds:['reference','ownership'],lanes:[['quantity-1','foundation-balls','foundation-players'],['foundation-owner-racket','foundation-owner-ball','foundation-owner-court']]},
  {id:'actions',title:'Playing / waiting · I / you / we',level:'A1',nodeIds:['participants','be-forms'],lanes:[['ongoing-1','ongoing-2'],['foundation-playing','foundation-waiting','foundation-we-playing']]},
  {id:'negative',title:'Positive / negative',level:'A1',nodeIds:['negation'],lanes:[['foundation-not-playing','foundation-not-waiting'],['permission-1','permission-2']]},
  {id:'places',title:'Places & directions',level:'A1',nodeIds:['time-place'],lanes:[['facilities-1','people-2','facilities-2'],['position-1','foundation-player-location','foundation-coach-location','foundation-court-location','position-4']]},
  {id:'more-owners',title:'People & ownership',level:'A1',nodeIds:['participants','ownership'],lanes:[['people-3','gear-3'],['possession-1','possession-2','possession-3']]},
  {id:'requests',title:'Short requests',level:'A1',nodeIds:['request-basics'],lanes:[['position-3','teamwork-1','teamwork-2'],['people-4','possession-4','gear-2','gear-4']]},
  {id:'now-routine',title:'Now / usually · can / cannot',level:'A1',nodeIds:['routine-now','negation'],lanes:[['ongoing-3','ongoing-4'],['permission-3','permission-4']]},
  {id:'time',title:'Times & duration',level:'A1',nodeIds:['time-place','questions'],lanes:[['quantity-3','quantity-2','quantity-4'],['times-1','times-2','times-3','times-4']]},
  {id:'next-done',title:'Planned / happening / completed',level:'A2',nodeIds:['future','completion'],lanes:[['plans-1','plans-2','plans-3','plans-4'],['finished-1','finished-2','finished-3','finished-4']]},
]
const assigned = new Set(explicit.flatMap(s=>s.lanes.flat()))
const rest = (topics:string[]) => padelPairs.filter(p=>topics.includes(p[1])&&!assigned.has(p[0])).map(p=>p[0])
const applications: Omit<Stage,'prerequisite'>[] = [
  {id:'desk',title:'Bookings & player numbers',level:'A2',nodeIds:['questions','quantity','request-basics'],lanes:[rest(['bookings','court_booking']),rest(['player_numbers'])]},
  {id:'hire',title:'Hire & payment',level:'A2',nodeIds:['quantity','request-basics'],lanes:[rest(['racket_hire','balls_grips']),rest(['prices','service'])]},
  {id:'court',title:'Court access, rain & rules',level:'A2',nodeIds:['sequence','obligation'],lanes:[rest(['facilities','position','teamwork','rain']),rest(['court_rules'])]},
  {id:'question-basics',title:'Who / what · where / when',level:'A2',nodeIds:['questions','time-place'],lanes:[rest(['question_identity']),rest(['question_place_time'])]},
  {id:'question-details',title:'Why / how · how long / how many',level:'A2',nodeIds:['questions','quantity'],lanes:[rest(['question_reason_method']),rest(['question_duration_number'])]},
]
export const padelStages: Stage[] = [...explicit,...applications].map((s,i,all)=>({...s,prerequisite:all[i-1]?.id}))
export const stageByPair = new Map(padelStages.flatMap(s=>s.lanes.flat().map(id=>[id,s] as const)))
const orderedIds=padelStages.flatMap(s=>s.lanes.flat())
// No silent "put new content anywhere" fallback.
if(new Set(orderedIds).size!==orderedIds.length || orderedIds.length!==padelPairs.length || padelPairs.some(p=>!stageByPair.has(p[0])))
  throw new Error('Every Padel pair must have exactly one teaching stage')
export const pairOrder = new Map(orderedIds.map((id,i)=>[id,i]))

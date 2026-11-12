import type {Action,ObjectCategory} from './actionDialogue'
export type ActionConnection='bare'|'direct'|'to'|'in'|'on'|'at'|'off'
export type ActionUse={objects:readonly ObjectCategory[];thai?:string;sentenceThai?:string;spoken?:string}
export type ActionUses=Partial<Record<ActionConnection,ActionUse>>
export type ActionBlueprint={id:string;connection:ActionConnection;nounCategories?:readonly ObjectCategory[]}
/** These are the two existing action forms. Potential word uses cannot add slots. */
export const activeActionBlueprints:readonly ActionBlueprint[]=[
 {id:'transitive-object',connection:'direct'},
 {id:'intransitive-to-object',connection:'to'},
]
export function potentialActionUses(action:Action):ActionUses{
 if(action.uses)return action.uses
 if(action.complement==='object')return {direct:{objects:action.objects}}
 if(action.destination)return {to:{objects:['destination']}}
 if(action.preposition)return {[action.preposition.english]:{objects:action.objects,thai:action.preposition.thai}}
 return action.complement==='none'?{bare:{objects:[]}}:{}
}
export function actionInBlueprint(action:Action,blueprint:ActionBlueprint):Action|undefined{
 const use=potentialActionUses(action)[blueprint.connection]
 if(!use)return undefined
 return {...action,objects:use.objects,spoken:use.spoken??action.spoken,sentenceThai:use.sentenceThai??action.sentenceThai,
  complement:blueprint.connection==='bare'?'none':blueprint.connection==='direct'?'object':blueprint.connection==='to'&&action.destination?'destination':'prepositional',
  preposition:['bare','direct'].includes(blueprint.connection)?undefined:{english:blueprint.connection,thai:use.thai??(blueprint.connection==='to'?'ที่':'—')}}
}
export function matchingActionBlueprint(action:Action,blueprints:readonly ActionBlueprint[]=activeActionBlueprints){return blueprints.find(blueprint=>!!actionInBlueprint(action,blueprint))}

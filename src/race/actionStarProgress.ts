import {actionStarsVersion,type StarProgress} from './actionStarContent'
export type CourseSave={version:string;progress:StarProgress;reported:string[]}
export const actionStarKey=(user?:string)=>`englishsuccess:action-stars:v1:${user??'guest'}`
export function loadActionStarProgress(user?:string):CourseSave{
 try{const saved=JSON.parse(localStorage.getItem(actionStarKey(user))??'null');if(saved?.version===actionStarsVersion&&Array.isArray(saved.reported))return {...saved,progress:Object.fromEntries(Object.entries(saved.progress??{}).filter(([star,result])=>{const r=result as {passes:number;best:number};return ['1','2','3'].includes(star)&&Number.isInteger(r?.passes)&&r.passes>=0&&Number.isInteger(r.best)&&r.best>=0&&r.best<=50}))}}catch{/* Storage is optional. */}
 return {version:actionStarsVersion,progress:{},reported:[]}
}

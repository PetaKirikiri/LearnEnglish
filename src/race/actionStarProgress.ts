import {actionStarsVersion,type StarProgress} from './actionStarContent'
export const adaptiveStarsVersion='composed-stars-v1'
export type CourseSave={version:string;progress:StarProgress;reported:string[]}
export const actionStarKey=(user?:string)=>`englishsuccess:action-stars:v1:${user??'guest'}`
export function loadActionStarProgress(user?:string):CourseSave{
 try{
  const saved=JSON.parse(localStorage.getItem(actionStarKey(user))??'null')
  const legacy=saved?.version===actionStarsVersion
  if((legacy||saved?.version===adaptiveStarsVersion)&&Array.isArray(saved.reported))return {version:adaptiveStarsVersion,reported:saved.reported,progress:Object.fromEntries(Object.entries(saved.progress??{}).filter(([star,result])=>{const r=result as {passes:number;best:number};return ['1','2','3'].includes(star)&&Number.isInteger(r?.passes)&&r.passes>=0&&Number.isInteger(r.best)&&r.best>=0&&r.best<=(legacy?50:30)}).map(([star,result])=>{const r=result as {passes:number;best:number};return [star,{...r,best:legacy?Math.round(r.best*30/50):r.best}]}))}
 }catch{/* Storage is optional. */}
 return {version:adaptiveStarsVersion,progress:{},reported:[]}
}
export function completeAdaptiveStar(progress:StarProgress,stars:1|2|3,score:number,total:number,unassisted:boolean):StarProgress{
 if((stars>1&&(progress[(stars-1) as 1|2]?.passes??0)<2)||total!==30||!Number.isInteger(score)||score<0||score>30)return progress
 const old=progress[stars]??{passes:0,best:0}
 return {...progress,[stars]:{best:Math.max(old.best,score),passes:old.passes+(unassisted&&score>=27?1:0)}}
}

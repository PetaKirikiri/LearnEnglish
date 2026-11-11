export type SpaceDemand={minimum:number;preferred:number}
/** Keep intrinsic minimums, spend spare room on text, then distribute remaining space. */
export function allocateColumns(items:readonly SpaceDemand[],width:number,gap:number):number[]{
 if(!items.length)return []
 const available=Math.max(0,width-gap*(items.length-1)),minimum=items.reduce((sum,item)=>sum+item.minimum,0)
 if(available<minimum)return items.map(item=>available*item.minimum/(minimum||1))
 const needs=items.map(item=>Math.max(0,item.preferred-item.minimum)),need=needs.reduce((sum,n)=>sum+n,0),spare=available-minimum
 if(need>0&&spare<=need)return items.map((item,index)=>item.minimum+spare*needs[index]/need)
 const preferred=items.reduce((sum,item)=>sum+item.preferred,0)
 return items.map(item=>item.preferred+(spare-need)*(item.preferred/(preferred||items.length)))
}

import {useLayoutEffect,type RefObject} from 'react'
import {allocateColumns,type SpaceDemand} from './matrixSizing'

type Node={element:HTMLElement;children:Node[];demand:SpaceDemand;gap:number}
/** Measure the rendered language/font, then allocate space through the actual group tree. */
export default function useMatrixSizing(ref:RefObject<HTMLDivElement|null>,enabled:boolean,contentKey:string,singleLine=false){
 useLayoutEffect(()=>{
  const root=ref.current
  if(!root||!enabled)return
  const slots=root.querySelector<HTMLElement>(':scope > .tonight-slots')
  if(!slots)return
  const context=document.createElement('canvas').getContext('2d')
  if(!context)return
  let frame=0,disposed=false,lastWidth=-1
  const styled=new Set<HTMLElement>()
  const measureText=(element:HTMLElement|null)=>{
   if(!element)return {full:0,word:0}
   const style=getComputedStyle(element)
   context.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
   const text=element.textContent?.trim()??''
   const widths=text.split(/\s+/u).map(word=>context.measureText(word).width)
   return {full:context.measureText(text).width,word:Math.max(0,...widths)}
  }
  const read=(element:HTMLElement):Node=>{
   const style=getComputedStyle(element),gap=parseFloat(style.columnGap)||0
   const card=element.matches('.tonight-slot')?element:element.matches('.cw-slot-shell')?element.querySelector<HTMLElement>(':scope > .tonight-slot'):null
   if(card){
    const source=measureText(card.querySelector('.example-source')),gloss=measureText(card.querySelector('.example-gloss'))
    const cardStyle=getComputedStyle(card)
    const inset=(parseFloat(cardStyle.paddingLeft)||0)+(parseFloat(cardStyle.paddingRight)||0)+4
    // Pictures keep a useful minimum; longer text earns space before short labels do.
    const art=Math.max(72,parseFloat(getComputedStyle(root).getPropertyValue('--matrix-art-height'))||60)
    return {element,children:[],gap:0,demand:{minimum:Math.max(72,source.word,Math.min(120,gloss.word))+inset,preferred:Math.max(art,source.full,Math.min(280,gloss.full))+inset}}
   }
   const children=Array.from(element.children).filter((child):child is HTMLElement=>child instanceof HTMLElement&&child.matches('.tonight-slot,.cw-slot-shell,.matrix-layout-leading,.matrix-role-group,.cw-noun-group,.matrix-agreement-group')&&getComputedStyle(child).display!=='none').map(read)
   return {element,children,gap,demand:{minimum:children.reduce((n,c)=>n+c.demand.minimum,0)+gap*Math.max(0,children.length-1),preferred:children.reduce((n,c)=>n+c.demand.preferred,0)+gap*Math.max(0,children.length-1)}}
  }
  const layout=(node:Node,width:number)=>{
   if(!node.children.length)return
   let count=node.children.length
   // Wrap whole semantic groups/cards when their readable minimums cannot fit.
   const demandsFor=(columns:number)=>Array.from({length:columns},(_,column)=>{
    const members=node.children.filter((_,index)=>index%columns===column)
    return {minimum:Math.max(...members.map(c=>c.demand.minimum)),preferred:Math.max(...members.map(c=>c.demand.preferred))}
   })
   const joined=node.element.matches('.cw-noun-group,.matrix-agreement-group')
   while(!singleLine&&!joined&&count>1&&demandsFor(count).reduce((sum,d)=>sum+d.minimum,0)+node.gap*(count-1)>width)count--
   const columns=allocateColumns(demandsFor(count),width,node.gap)
   node.element.style.gridTemplateColumns=columns.map(value=>`minmax(0,${Math.max(0,value).toFixed(2)}px)`).join(' ')
   styled.add(node.element)
   node.children.forEach((child,index)=>layout(child,columns[index%count]))
  }
  const measure=()=>{
   if(disposed)return
   const width=singleLine?slots.clientWidth:slots.getBoundingClientRect().width
   if(width<=0)return
   layout(read(slots),width)
   // Keep the controls on the same tracks as their sentence groups.
   const toolbar=root.querySelector<HTMLElement>(':scope > .matrix-layout-toolbar')
   if(toolbar){toolbar.style.gridTemplateColumns=slots.style.gridTemplateColumns;styled.add(toolbar)}
   const leading=root.querySelector<HTMLElement>('.matrix-layout-leading'),controls=root.querySelector<HTMLElement>('.matrix-layout-leading-controls')
   if(leading&&controls){controls.style.gridTemplateColumns=leading.style.gridTemplateColumns;styled.add(controls)}
  }
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure)}
  measure()
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(entries=>{
   const width=entries[0]?.contentRect.width??0
   if(Math.abs(width-lastWidth)>.5){lastWidth=width;schedule()}
  })
  observer?.observe(root)
  void document.fonts?.ready.then(()=>{if(!disposed)schedule()})
  document.fonts?.addEventListener('loadingdone',schedule)
  return()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();document.fonts?.removeEventListener('loadingdone',schedule);styled.forEach(element=>element.style.removeProperty('grid-template-columns'))}
 },[ref,enabled,contentKey,singleLine])
}

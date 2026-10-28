import { useEffect, useRef } from 'react'
import type { CityPrediction } from './prediction'
import { WORLD, playerColors, type CityState } from './world'
type Focus = { playerId: string; prediction: CityPrediction }
export default function CityCanvas({state,focus}:{state:CityState|null;focus?:Focus}){
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef({state,focus})
 useEffect(()=>{latest.current={state,focus}},[state,focus])
 useEffect(()=>{
  const node=canvas.current!,ctx=node.getContext('2d')!,map=new Image(),atlas=new Image();map.src='/city/town-samui.png';atlas.src='/city/players.png'
  let raf=0,last=performance.now(),camera:{x:number;y:number}|null=null;const positions=new Map<string,{x:number;y:number}>()
  function draw(now:number){
   const rect=node.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2),width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr)
   if(node.width!==width||node.height!==height){node.width=width;node.height=height}
   const dt=Math.min(.05,(now-last)/1000);last=now
   const {state:current,focus:follow}=latest.current
   const predicted=follow?.prediction.display()
   const own=predicted??current?.players.find(p=>p.id===follow?.playerId)
   let viewWidth=WORLD.width,viewHeight=WORLD.height,left=0,top=0
   if(follow&&own){
    viewWidth=Math.min(860,360*width/Math.max(1,height));viewHeight=viewWidth*height/Math.max(1,width)
    const target={x:Math.max(0,Math.min(WORLD.width-viewWidth,own.x-viewWidth/2)),y:Math.max(0,Math.min(WORLD.height-viewHeight,own.y-35-viewHeight/2))}
    if(!camera)camera=target
    const blend=1-Math.exp(-12*dt);camera.x+=(target.x-camera.x)*blend;camera.y+=(target.y-camera.y)*blend
    left=camera.x;top=camera.y
   }
   ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,width,height)
   ctx.setTransform(width/viewWidth,0,0,height/viewHeight,-left*width/viewWidth,-top*height/viewHeight)
   if(map.complete&&map.naturalWidth)ctx.drawImage(map,0,0,WORLD.width,WORLD.height)
   const players=(current?.players??[]).map(p=>p.id===follow?.playerId&&predicted?predicted:p)
   for(const p of [...players].sort((a,b)=>a.y-b.y)){
    let point=positions.get(p.id);if(!point){point={x:p.x,y:p.y};positions.set(p.id,point)}
    const blend=p.id===follow?.playerId?1:1-Math.exp(-20*dt);point.x+=(p.x-point.x)*blend;point.y+=(p.y-point.y)*blend
    const {x,y}=point,moving=p.online&&!current?.paused&&Math.hypot(p.dx,p.dy)>.08,color=playerColors[(current?.players.findIndex(v=>v.id===p.id)??0)%playerColors.length]
    ctx.globalAlpha=p.online?1:.45
    ctx.fillStyle='#15253d33';ctx.beginPath();ctx.ellipse(x,y+2,23,8,0,0,Math.PI*2);ctx.fill()
    ctx.strokeStyle=p.found?'#18a55a':color;ctx.lineWidth=4;ctx.fillStyle=color+'66';ctx.beginPath();ctx.ellipse(x,y,25,9,0,0,Math.PI*2);ctx.fill();ctx.stroke()
    const row=p.facing==='up'?1:p.facing==='down'?0:moving?2+Math.floor(now/150)%2:2
    const size=88,bob=moving?Math.sin(now/90)*1.7:0
    if(atlas.complete&&atlas.naturalWidth){ctx.save();ctx.translate(x,y-39+bob);if(p.facing==='left')ctx.scale(-1,1);ctx.drawImage(atlas,p.avatar*atlas.naturalWidth/4,row*atlas.naturalHeight/4,atlas.naturalWidth/4,atlas.naturalHeight/4,-size/2,-size/2,size,size);ctx.restore()}
    if(p.id!==follow?.playerId){ctx.font='800 16px Nunito, sans-serif';const label=p.name+(p.found?' ✓':''),w=ctx.measureText(label).width+24
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.roundRect(x-w/2,y+13,w,26,12);ctx.fill();ctx.fillStyle='#18385e';ctx.textAlign='center';ctx.fillText(label,x,y+32)}
    if(p.speech){ctx.font='800 18px Nunito, sans-serif';const bw=ctx.measureText(p.speech).width+28,bx=Math.max(8,Math.min(WORLD.width-bw-8,x-bw/2));ctx.fillStyle='white';ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(bx,y-132,bw,37,16);ctx.fill();ctx.stroke();ctx.fillStyle='#18385e';ctx.fillText(p.speech,bx+bw/2,y-108)}
    ctx.globalAlpha=1
   }
   const ids=new Set(current?.players.map(p=>p.id));for(const id of positions.keys())if(!ids.has(id))positions.delete(id)
   raf=requestAnimationFrame(draw)
  }
  raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf)
 },[])
 return <canvas ref={canvas} className={focus?'city-canvas city-closeup-canvas':'city-canvas'} aria-label={`${focus?'Nearby streets':'City map'}. ${state?.players.map(p=>`${p.name}${p.found?' has arrived':''}`).join(', ')||'Waiting for players'}`}/>
}

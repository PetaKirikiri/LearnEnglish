import { useRef, useState, type PointerEvent } from 'react'
export default function Joystick({onMove,disabled=false}:{onMove:(x:number,y:number)=>void;disabled?:boolean}){
 const [stick,setStick]=useState({x:0,y:0}),pointer=useRef<number|null>(null)
 function move(event:PointerEvent<HTMLDivElement>){if(pointer.current!==event.pointerId||disabled)return;const rect=event.currentTarget.getBoundingClientRect(),radius=rect.width*.32;let x=(event.clientX-rect.left-rect.width/2)/radius,y=(event.clientY-rect.top-rect.height/2)/radius;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length}if(length<.12){x=0;y=0}setStick({x:x*radius,y:y*radius});onMove(x,y)}
 function release(){pointer.current=null;setStick({x:0,y:0});onMove(0,0)}
 return <div className={`city-joystick${disabled?' is-disabled':''}`} role="group" aria-label="Movement joystick" onPointerDown={event=>{if(disabled||pointer.current!==null)return;pointer.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);move(event)}} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
  <svg className="city-joystick-arrows" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="m50 8-7 12h14ZM8 50l12 7V43Zm84 0L80 43v14ZM50 92l7-12H43Z"/></svg><span className="city-joystick-thumb" style={{transform:`translate(${stick.x}px,${stick.y}px)`}}/>
 </div>
}

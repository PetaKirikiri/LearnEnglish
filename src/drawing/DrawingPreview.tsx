import {useEffect,useState} from 'react'
import {DrawingStudent} from './DrawingGame'
import DrawingJoin from './DrawingJoin'
import {drawingVocabulary} from './vocabulary'
import type {Game} from './game'
const picture=(kind:'house'|'flower')=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="white"/><g stroke-linejoin="round" stroke-linecap="round" stroke-width="12" fill="none">${kind==='house'?'<circle cx="240" cy="190" r="75" stroke="#eeb522"/><path d="m290 245 140 140m-40-40 32-32m-65 0 32-32" stroke="#eeb522"/>':'<rect x="220" y="70" width="200" height="340" rx="30" stroke="#1877ef"/><path d="M250 120h140v220H250Zm60-25h25" stroke="#1877ef"/><circle cx="320" cy="375" r="12" stroke="#1877ef"/>'}</g></svg>`)

function initial(round:number):Game{return {active:true,round,phase:'lobby',deadline:null,serverNow:new Date().toISOString(),artist:'preview',revealed:false,vote:null,voteCount:0,drawings:[{artist:'preview',name:'You',thai:drawingVocabulary.find(w=>w.word==='book')!.thai,english:'a book',picture:'',submitted:false,awarded:null,winner:false},{artist:'mali',name:'Mali',thai:null,english:'a key',picture:picture('house'),submitted:true,awarded:null,winner:false},{artist:'ben',name:'Ben',thai:null,english:'a phone',picture:picture('flower'),submitted:true,awarded:null,winner:false}],scores:[{id:'preview',name:'You',points:0},{id:'mali',name:'Mali',points:0},{id:'ben',name:'Ben',points:0}]}}
export default function DrawingPreview(){
 if(new URLSearchParams(location.search).get('phone')!=='1')return <main className="dg dg-phone"><DrawingJoin url={`${location.origin}/english/game/preview?phone=1`} title="Scan to try the game"/></main>
 return <PhonePreview/>
}
function PhonePreview(){
 const [game,setGame]=useState(()=>initial(1))
 const finished=game.drawings.filter(d=>d.finishRank).length
 useEffect(()=>{if(game.phase!=='drawing')return;const timers=['mali','ben'].map((artist,index)=>setTimeout(()=>setGame(g=>{if(g.phase!=='drawing'||g.drawings.find(d=>d.artist===artist)?.finishRank)return g;const rank=g.drawings.filter(d=>d.finishRank).length+1;return {...g,drawings:g.drawings.map(d=>d.artist===artist?{...d,finishRank:rank,finishBonus:Math.max(0,4-rank)}:d)}}),Math.max(0,Date.parse(game.deadline!)-60000+(index+1)*20000-Date.now())));return()=>timers.forEach(clearTimeout)},[game.phase,game.deadline])
 useEffect(()=>{const delay=game.phase==='lobby'?3000:game.phase==='drawing'?(finished===game.drawings.length?2000:Math.max(0,Date.parse(game.deadline!)-Date.now())):game.phase==='guessing'?(game.revealed?2500:30000):game.phase==='voting'?(game.vote?2500:30000):15000;
  const timer=setTimeout(()=>setGame(g=>{
   if(g.phase==='lobby')return {...g,phase:'drawing',deadline:new Date(Date.now()+60000).toISOString()};
   if(g.phase==='drawing')return {...g,phase:'guessing',artist:'preview'};
   if(g.phase==='guessing')return {...g,phase:'voting'};
   if(g.phase==='voting')return {...g,phase:'results',drawings:g.drawings.map(d=>({...d,winner:d.artist===(g.vote??'mali')}))};
   return initial(g.round+1)
  }),delay);return()=>clearTimeout(timer)
 },[game.phase,game.deadline,game.revealed,game.vote,finished])
 async function act(action:string,payload:Record<string,unknown>={}){setGame(g=>{if(action==='complete'){const rank=g.drawings.filter(d=>d.finishRank).length+1;return {...g,drawings:g.drawings.map(d=>d.artist==='preview'&&!d.finishRank?{...d,picture:String(payload.picture),submitted:true,finishRank:rank,finishBonus:Math.max(0,4-rank)}:d)}};if(action==='save')return {...g,drawings:g.drawings.map(d=>d.artist==='preview'?{...d,picture:String(payload.picture),submitted:true}:d)};if(action==='award')return {...g,revealed:true,drawings:g.drawings.map(d=>d.artist===g.artist?{...d,awarded:d.awarded??String(payload.learner)}:d)};if(action==='vote')return {...g,vote:g.vote??String(payload.artist),voteCount:1};return g});return true}
 const shown={...game,scores:game.scores.map(p=>({...p,points:(game.drawings.find(d=>d.artist===p.id)?.finishBonus??0)+game.drawings.filter(d=>d.awarded===p.id).length+3*game.drawings.filter(d=>d.winner&&d.artist===p.id).length}))}
 return <DrawingStudent game={shown} userId="preview" busy={false} error="" act={act} offset={0}/>
}

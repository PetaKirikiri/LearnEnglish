import {useCallback,useEffect,useRef,useState} from 'react'
import {supabase} from '../lib/supabase'
export type Drawing={artist:string;name:string;avatar?:string|null;thai:string|null;english:string|null;picture:string;submitted:boolean;awarded:string|null;winner:boolean;finishRank?:number|null;finishBonus?:number}
export type Game={active:boolean;round:number;phase:'lobby'|'drawing'|'guessing'|'voting'|'results';deadline:string|null;serverNow:string;artist:string|null;revealed:boolean;vote:string|null;voteCount:number;drawings:Drawing[];scores:{id:string;name:string;avatar?:string|null;points:number}[]}
export function useDrawingGame(sessionId:string,host=false){
 const [game,setGame]=useState<Game>(),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const alive=useRef(true),mutating=useRef(false),revision=useRef(0),offset=useRef(0)
 const request=useCallback(async(action:string,payload:Record<string,unknown>={})=>{
  const {data,error}=await supabase.rpc('english_drawing_game',{p_action:action,p_session:sessionId,p_payload:{...payload,...(host?{hostSecret:localStorage.getItem('su-classroom-host-key')}:{})}})
  if(error)throw new Error(error.message)
  offset.current=Date.parse(data.serverNow)-Date.now();return data as Game
 },[sessionId,host])
 useEffect(()=>{alive.current=true;let pending=false;const poll=async()=>{if(pending||mutating.current||!sessionId)return;pending=true;const version=revision.current;try{const next=await request('state');if(alive.current&&version===revision.current){setGame(next);setError('')}}catch(e){if(alive.current)setError((e as Error).message)}finally{pending=false}};void poll();const timer=setInterval(()=>void poll(),1200);return()=>{alive.current=false;clearInterval(timer)}},[request,sessionId])
 const act=useCallback(async(action:string,payload:Record<string,unknown>={})=>{if(mutating.current)return false;mutating.current=true;revision.current++;setBusy(true);try{const next=await request(action,payload);if(alive.current){setGame(next);setError('')}return true}catch(e){if(alive.current)setError((e as Error).message);return false}finally{mutating.current=false;setBusy(false)}},[request])
 return {game,error,busy,act,offset}
}

export async function drawingHostCall(action:'open'|'close',sessionId:string){
 const {data,error}=await supabase.rpc('english_drawing_game',{p_action:action,p_session:sessionId,p_payload:{hostSecret:localStorage.getItem('su-classroom-host-key')}})
 if(error)throw new Error(error.message)
 return data as Game
}

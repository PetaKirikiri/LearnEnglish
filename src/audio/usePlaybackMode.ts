import {useCallback,useState} from 'react'
export type PlaybackMode='slow'|'normal'
const key='englishsuccess:playback-mode'
export function usePlaybackMode(){
 const [mode,setMode]=useState<PlaybackMode>(()=>{
  try{return localStorage.getItem(key)==='slow'?'slow':'normal'}catch{return 'normal'}
 })
 const choose=useCallback((next:PlaybackMode)=>{
  setMode(next)
  try{localStorage.setItem(key,next)}catch{/* The choice still applies to this session. */}
 },[])
 return [mode,choose] as const
}

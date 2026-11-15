import {useSyncExternalStore} from 'react'
export type PlaybackMode='slow'|'normal'
const key='englishsuccess:playback-mode'
let selected:PlaybackMode|undefined
const listeners=new Set<()=>void>()
export function getPlaybackMode():PlaybackMode{
 if(selected)return selected
 try{return localStorage.getItem(key)==='slow'?'slow':'normal'}catch{return 'normal'}
}
export function getPlaybackRate(){return getPlaybackMode()==='slow'?.7:1}
function choose(next:PlaybackMode){
 selected=next
 try{localStorage.setItem(key,next)}catch{/* Keep the preference for this session. */}
 for(const notify of listeners)notify()
}
function subscribe(notify:()=>void){
 listeners.add(notify)
 const storage=(event:StorageEvent)=>{if(event.key===key){selected=undefined;notify()}}
 window.addEventListener('storage',storage)
 return()=>{listeners.delete(notify);window.removeEventListener('storage',storage)}
}
export function usePlaybackMode(){
 return [useSyncExternalStore(subscribe,getPlaybackMode,()=> 'normal' as const),choose] as const
}

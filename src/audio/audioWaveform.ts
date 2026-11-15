export type AudioWaveState = {level:number;time:number}
export type AudioWaveform = {interval:number;levels:number[]}

/** Measure the real recording in 20ms windows, preserving silence between syllables. */
export function waveformFromChannels(channels:readonly Float32Array[],sampleRate:number):AudioWaveform {
 const interval=.02
 if(!channels.length||!Number.isFinite(sampleRate)||sampleRate<=0)return {interval,levels:[]}
 const size=Math.max(1,Math.round(sampleRate*interval)),length=Math.min(...channels.map(channel=>channel.length))
 const levels:number[]=[]
 for(let start=0;start<length;start+=size){
  const end=Math.min(length,start+size)
  let sum=0
  for(const channel of channels)for(let index=start;index<end;index++)sum+=channel[index]*channel[index]
  levels.push(Math.sqrt(sum/((end-start)*channels.length)))
 }
 const peak=Math.max(.01,...levels)
 return {interval,levels:levels.map(level=>level<.003?0:level/peak)}
}

export function waveformAtTime(waveform:AudioWaveform,time:number):number {
 if(!Number.isFinite(time)||time<0)return 0
 const position=time/waveform.interval,index=Math.floor(position)
 const start=waveform.levels[index]??0,end=waveform.levels[index+1]??0
 return start+(end-start)*(position-index)
}

let decoder:AudioContext|undefined
/** Decoding has no audio output: the existing player retains natural playback and mobile controls. */
export async function loadAudioWaveform(url:string):Promise<AudioWaveform|null>{
 const AudioDecoder=window.AudioContext??(window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext
 if(!AudioDecoder)return null
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(15000)})
  if(!response.ok)return null
  decoder??=new AudioDecoder()
  const audio=await decoder.decodeAudioData(await response.arrayBuffer())
  const channels=Array.from({length:audio.numberOfChannels},(_,index)=>audio.getChannelData(index))
  return waveformFromChannels(channels,audio.sampleRate)
 }catch{return null}
}

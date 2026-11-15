/** A real 100ms PCM clip: a one-sample WAV is rejected by iPhone audio decoders. */
export function silentPlaybackUrl():string{
 const frames=1600,bytes=new Uint8Array(44+frames*2),view=new DataView(bytes.buffer)
 const text=(offset:number,value:string)=>{for(let i=0;i<value.length;i++)bytes[offset+i]=value.charCodeAt(i)}
 text(0,'RIFF');view.setUint32(4,bytes.length-8,true);text(8,'WAVE');text(12,'fmt ')
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true)
 view.setUint32(24,16000,true);view.setUint32(28,32000,true);view.setUint16(32,2,true);view.setUint16(34,16,true)
 text(36,'data');view.setUint32(40,frames*2,true)
 return 'data:audio/wav;base64,'+btoa(String.fromCharCode(...bytes))
}
/** Call during the tap, then wait for the valid clip to start before replacing src. */
export function unlockAudio(player:HTMLAudioElement):Promise<void>{
 return new Promise(resolve=>{
  const finish=()=>{clearTimeout(timer);resolve()}
  const timer=setTimeout(finish,2000)
  try{void Promise.resolve(player.play()).then(finish,finish)}catch{finish()}
 })
}

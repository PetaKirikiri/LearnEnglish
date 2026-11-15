/// <reference lib="webworker" />
import {KokoroTTS} from 'kokoro-js'
let model:ReturnType<typeof KokoroTTS.from_pretrained>|undefined
let queue=Promise.resolve()
self.onmessage=(event:MessageEvent<{id:number;text:string}>)=>{
 const {id,text}=event.data
 queue=queue.then(async()=>{
  try{
   model??=KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'wasm',progress_callback:event=>{
    if(event.status==='progress'&&event.file.endsWith('.onnx'))self.postMessage({id,progress:{phase:'downloading',progress:event.progress}})
   }})
   const voice=await model
   self.postMessage({id,progress:{phase:'generating'}})
   const audio=await voice.generate(text,{voice:'af_heart'})
   self.postMessage({id,blob:audio.toBlob()})
  }catch{model=undefined;self.postMessage({id,error:true})}
 })
}

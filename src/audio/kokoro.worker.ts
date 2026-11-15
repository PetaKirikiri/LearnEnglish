/// <reference lib="webworker" />
import {KokoroTTS} from 'kokoro-js'
let model:ReturnType<typeof KokoroTTS.from_pretrained>|undefined
self.onmessage=async(event:MessageEvent<{id:number;text:string}>)=>{
 const {id,text}=event.data
 try{
  model??=KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'wasm'})
  const audio=await(await model).generate(text,{voice:'af_heart'})
  self.postMessage({id,blob:audio.toBlob()})
 }catch{model=undefined;self.postMessage({id,error:true})}
}

import {KokoroTTS} from 'kokoro-js'
import {AutoModelForCTC,AutoProcessor,AutoTokenizer,env} from '@huggingface/transformers'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {packagedVoiceModels} from './packagedVoiceModels'
import {alignCTC} from '../src/audio/forcedAlignment'
import type {SentenceTiming} from '../src/audio/sentenceTiming'
env.cacheDir=join(tmpdir(),'english-kokoro-models')
env.allowLocalModels=true
env.allowRemoteModels=false
let voice:ReturnType<typeof KokoroTTS.from_pretrained>|undefined
let alignment:Promise<{network:Awaited<ReturnType<typeof AutoModelForCTC.from_pretrained>>;processor:Awaited<ReturnType<typeof AutoProcessor.from_pretrained>>;labels:Record<string,string>;blank:number}>|undefined
let queue=Promise.resolve()
export function synthesizeKokoro(text:string):Promise<{bytes:Buffer;timing?:SentenceTiming}>{
 const task=queue.then(async()=>{
  env.localModelPath=await packagedVoiceModels()
  voice??=KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'cpu'})
  const audio=await(await voice).generate(text,{voice:'af_heart'})
  const samples=audio.audio,rate=audio.sampling_rate
  const bytes=Buffer.alloc(44+samples.length*2)
  bytes.write('RIFF',0);bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22)
  bytes.writeUInt32LE(rate,24);bytes.writeUInt32LE(rate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(samples.length*2,40)
  for(let i=0;i<samples.length;i++)bytes.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),44+i*2)
  let timing:SentenceTiming|undefined
  try{
   alignment??=(async()=>{
    const id='onnx-community/wav2vec2-base-960h-ONNX'
    const [network,processor,tokenizer]=await Promise.all([AutoModelForCTC.from_pretrained(id,{dtype:'q8',device:'cpu'}),AutoProcessor.from_pretrained(id),AutoTokenizer.from_pretrained(id)])
    const alphabet=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',"'",'|'],ids=tokenizer.model.convert_tokens_to_ids(alphabet)
    return {network,processor,labels:Object.fromEntries(alphabet.flatMap((label,i)=>ids[i]!==tokenizer.unk_token_id?[[String(ids[i]),label]]:[])),blank:tokenizer.pad_token_id??0}
   })()
   const {network,processor,labels,blank}=await alignment
   const resampled=new Float32Array(Math.floor(samples.length*16000/rate))
   for(let i=0;i<resampled.length;i++){const position=i*rate/16000,left=Math.floor(position),fraction=position-left;resampled[i]=samples[left]*(1-fraction)+(samples[left+1]??samples[left])*fraction}
   const output=await network(await processor(resampled,{sampling_rate:16000})),logits=output.logits
   timing=alignCTC(text,logits.data,logits.dims[1],logits.dims[2],labels,samples.length/rate,blank)
  }catch(error){alignment=undefined;console.warn('Server word alignment unavailable',error instanceof Error?error.name:'unknown')}
  return {bytes,timing}
 })
 queue=task.then(()=>{},()=>{voice=undefined})
 return task
}

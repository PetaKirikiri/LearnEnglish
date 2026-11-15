/// <reference lib="webworker" />
import {AutoModelForCTC,AutoProcessor,AutoTokenizer,env} from '@huggingface/transformers'
import {alignCTC} from './forcedAlignment'
env.backends.onnx.wasm!.numThreads=1
const modelId='onnx-community/wav2vec2-base-960h-ONNX'
let model:ReturnType<typeof AutoModelForCTC.from_pretrained>|undefined
let processor:ReturnType<typeof AutoProcessor.from_pretrained>|undefined
let tokenizer:ReturnType<typeof AutoTokenizer.from_pretrained>|undefined
let work=Promise.resolve()
self.onmessage=(event:MessageEvent<{id:number;text:string;samples:Float32Array}>)=>{
 const {id,text,samples}=event.data
 work=work.then(async()=>{
  try{
   model??=AutoModelForCTC.from_pretrained(modelId,{dtype:'q8',device:'wasm'})
   processor??=AutoProcessor.from_pretrained(modelId)
   tokenizer??=AutoTokenizer.from_pretrained(modelId)
   const [network,prepare,tokens]=await Promise.all([model,processor,tokenizer])
   const inputs=await prepare(samples,{sampling_rate:16000})
   const result=await network(inputs)
   const logits=result.logits
   const alphabet=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',"'",'|']
   const ids=tokens.model.convert_tokens_to_ids(alphabet)
   const labels=Object.fromEntries(alphabet.flatMap((label,index)=>ids[index]!==tokens.unk_token_id?[[String(ids[index]),label]]:[]))
   const timing=alignCTC(text,logits.data,logits.dims[1],logits.dims[2],labels,samples.length/16000,tokens.pad_token_id??0)
   self.postMessage({id,timing})
  }catch(error){console.warn('Local alignment failed',error instanceof Error?error.message:'Unknown error');model=undefined;processor=undefined;tokenizer=undefined;self.postMessage({id,error:true})}
 })
}

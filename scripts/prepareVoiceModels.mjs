import {mkdir,access,copyFile,rename} from 'node:fs/promises'
import {createReadStream,createWriteStream} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {Readable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import {createGzip} from 'node:zlib'
const models=[['onnx-community/Kokoro-82M-v1.0-ONNX','1939ad2a8e416c0acfeecc08a694d14ef25f2231'],['onnx-community/wav2vec2-base-960h-ONNX','729c1a6730fb549c20a1c73a3d3f96f11020225e']]
const exists=async file=>{try{await access(file);return true}catch{return false}}
for(const [model,revision] of models){
 const destination=join('api','kokoro-models',model),cache=join('node_modules','.cache','english-server-models',revision)
 await mkdir(join(destination,'onnx'),{recursive:true});await mkdir(join(cache,'onnx'),{recursive:true})
 for(const file of ['config.json','tokenizer.json','tokenizer_config.json','preprocessor_config.json','special_tokens_map.json','added_tokens.json']){
  const target=join(destination,file);if(await exists(target))continue
  const response=await fetch(`https://huggingface.co/${model}/resolve/${revision}/${file}`,{signal:AbortSignal.timeout(30000)})
  if(response.status===404)continue
  if(!response.ok)throw new Error(`Model configuration download failed: ${model}/${file}`)
  await pipeline(Readable.fromWeb(response.body),createWriteStream(target))
 }
 const compressed=join(destination,'onnx','model_quantized.onnx.gz');if(await exists(compressed))continue
 const cached=join(cache,'onnx','model_quantized.onnx'),local=join(tmpdir(),'english-kokoro-models',model,'onnx','model_quantized.onnx')
 if(!await exists(cached)){
  if(await exists(local))await copyFile(local,cached)
  else{const response=await fetch(`https://huggingface.co/${model}/resolve/${revision}/onnx/model_quantized.onnx`,{signal:AbortSignal.timeout(180000)});if(!response.ok)throw new Error(`Model download failed: ${model}`);await pipeline(Readable.fromWeb(response.body),createWriteStream(cached+'.tmp'));await rename(cached+'.tmp',cached)}
 }
 await pipeline(createReadStream(cached),createGzip({level:6}),createWriteStream(compressed+'.tmp'))
 await rename(compressed+'.tmp',compressed)
 console.log(`Packaged CPU model: ${model}`)
}

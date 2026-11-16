import {mkdir,readdir,copyFile,access,rename} from 'node:fs/promises'
import {createReadStream,createWriteStream} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {pipeline} from 'node:stream/promises'
import {createGunzip} from 'node:zlib'
let ready:Promise<string>|undefined
/** Models ship in the function; runtime never downloads them onto LINE or from a hub. */
export function packagedVoiceModels():Promise<string>{
 ready??=(async()=>{
  const root=join(tmpdir(),'english-packaged-voice-v1')
  for(const model of ['onnx-community/Kokoro-82M-v1.0-ONNX','onnx-community/wav2vec2-base-960h-ONNX']){
   const source=join(process.cwd(),'api','kokoro-models',model),destination=join(root,model)
   await mkdir(join(destination,'onnx'),{recursive:true})
   for(const name of await readdir(source))if(name.endsWith('.json'))await copyFile(join(source,name),join(destination,name))
   const target=join(destination,'onnx','model_quantized.onnx')
   try{await access(target)}catch{await pipeline(createReadStream(join(source,'onnx','model_quantized.onnx.gz')),createGunzip(),createWriteStream(target+'.tmp'));await rename(target+'.tmp',target)}
  }
  return root
 })().catch(error=>{ready=undefined;throw error})
 return ready
}

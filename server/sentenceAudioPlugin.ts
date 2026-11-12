import {loadEnv,type Plugin} from 'vite'
import handler from './sentenceAudio'
export function sentenceAudioPlugin():Plugin{return {name:'sentence-audio',configureServer(server){
 Object.assign(process.env,loadEnv(server.config.mode,server.config.root,''))
 server.middlewares.use('/api/sentence-audio',(req,res)=>{void handler(req,res)})
}}}

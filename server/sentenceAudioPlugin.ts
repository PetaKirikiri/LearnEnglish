import {loadEnv,type Plugin} from 'vite'
import handler from './sentenceAudio'
export function sentenceAudioPlugin():Plugin{return {name:'sentence-audio',configureServer(server){
 Object.assign(process.env,loadEnv(server.config.mode,server.config.root,''))
 server.middlewares.use('/api/sentence-audio',(req,res)=>{
  const loopback=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress??'')
  const origin=req.headers.origin
  const ownOrigin=!origin||(()=>{try{return new URL(origin).host===req.headers.host}catch{return false}})()
  void handler(req,res,{localDevelopment:loopback&&ownOrigin})
 })
}}}

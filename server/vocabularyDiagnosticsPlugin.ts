import {loadEnv,type Plugin} from 'vite'
import handler from './vocabularyDiagnostics'
export function vocabularyDiagnosticsPlugin():Plugin{return {name:'private-vocabulary-diagnostics',apply:'serve',configureServer(server){
 Object.assign(process.env,loadEnv(server.config.mode,server.config.root,''))
 server.middlewares.use('/__diagnostics/vocabulary',(req,res)=>{void handler(req,res)})
}}}

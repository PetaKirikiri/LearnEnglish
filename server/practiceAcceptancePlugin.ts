import type {Plugin} from 'vite'
import {spawn,type ChildProcess} from 'node:child_process'
import {readFileSync} from 'node:fs'
export function practiceAcceptancePlugin():Plugin{
 return {name:'local-practice-acceptance',apply:'serve',configureServer(server){
  let child:ChildProcess|undefined
  let state:{status:string;started:number|null;finished:number|null;stage:string;log:string[];progress:unknown;result:unknown;exitCode:number|null}={status:'idle',started:null,finished:null,stage:'Ready',log:[],progress:null,result:null,exitCode:null}
  try{state.result=JSON.parse(readFileSync(`${server.config.root}/reports/full-progression-audit.json`,'utf8'));state.stage='Previous result available — ready to run again'}catch{/* No completed local run yet. */}
  const stop=()=>{if(child?.pid)try{process.kill(-child.pid,'SIGTERM')}catch{/* Already stopped. */}}
  server.httpServer?.once('close',stop)
  server.middlewares.use('/__practice_acceptance',(req,res,next)=>{
   if(!['/status','/start','/stop'].includes((req.url??'').split('?')[0]))return next()
   const remote=req.socket.remoteAddress??'',host=req.headers.host??''
   if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote)||! /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)||req.headers.origin&&req.headers.origin!==`http://${host}`){res.statusCode=403;res.end('Local computer only');return}
   res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store')
   if(req.url==='/start'&&req.method==='POST'){
    if(child){res.statusCode=409;res.end(JSON.stringify({error:'Already running'}));return}
    state={status:'running',started:Date.now(),finished:null,stage:'Checking blueprint slot-serving architecture',log:[],progress:null,result:null,exitCode:null}
    const {PROGRESSION_CHECKPOINT: _checkpoint,...env}=process.env
    child=spawn(process.execPath,['scripts/runPracticeAcceptance.mjs'],{cwd:server.config.root,env,detached:true,stdio:['ignore','pipe','pipe']})
    let pending=''
    const append=(chunk:Buffer)=>{
     pending+=chunk.toString().replace(/\x1b\[[0-9;]*m/g,'')
     const lines=pending.split(/\r?\n/);pending=lines.pop()??''
     for(const line of lines){if(!line.trim())continue;state.log.push(line);if(state.log.length>250)state.log.shift();try{const value=JSON.parse(line);if(typeof value.answered==='number'){state.progress=value;state.stage='Walking fresh learner progression'}else if(value.bank)state.stage=`Auditing ${value.bank} bank`}catch{/* Ordinary test output. */}}
    }
    child.stdout?.on('data',append);child.stderr?.on('data',append)
    child.once('error',error=>{state.log.push(error.message);state.status='failed';state.finished=Date.now()})
    child.once('exit',(code,signal)=>{state.exitCode=code;state.finished=Date.now();if(state.status==='stopping')state.status='stopped';else state.status=code===0?'passed':'failed';state.stage=state.status==='passed'?'All checks passed':signal?'Stopped': 'Check the log below';if(code===0)try{state.result=JSON.parse(readFileSync(`${server.config.root}/reports/full-progression-audit.json`,'utf8'))}catch{/* Log remains available. */}child=undefined})
   }else if(req.url==='/stop'&&req.method==='POST'){
    if(child){state.status='stopping';state.stage='Stopping local tests';stop()}
   }else if(req.url!=='/status'||req.method!=='GET'){res.statusCode=405;res.end(JSON.stringify({error:'Unsupported request'}));return}
   res.end(JSON.stringify(state))
  })
 }}
}

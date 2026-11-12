import {rmSync} from 'node:fs'
import {Window} from 'happy-dom'
rmSync('reports/full-progression-audit.json',{force:true})
const window=new Window({url:'http://localhost'})
Object.assign(globalThis,{window,localStorage:window.localStorage,document:window.document})
// No Vitest worker/RPC: a cold catalogue build cannot time out the reporter.
const {runProgressionAcceptance}=await import('../src/race/testing/progressionAcceptance')
try{await runProgressionAcceptance();console.log('PASS: fresh shared-selector progression, presentation scoring and blueprint integrity')}catch(error){console.error(error);process.exitCode=1}
finally{await window.happyDOM.close()}

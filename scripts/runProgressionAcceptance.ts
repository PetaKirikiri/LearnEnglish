import {spawnSync} from 'node:child_process'
import {rmSync} from 'node:fs'
// Keep the same bank tripwire active throughout the REAL progression walk,
// including later learner states. It throws before a bank can block the worker.
rmSync('reports/full-progression-audit.json',{force:true})
const {PROGRESSION_CHECKPOINT: _checkpoint,...env}=process.env
const result=spawnSync(process.execPath,[
 'node_modules/vitest/vitest.mjs','run','src/race/fullProgressionAudit.test.ts','--maxWorkers=1',
],{stdio:'inherit',env:{...env,RUN_FULL_PROGRESSION_AUDIT:'1'}})
if(result.error)throw result.error
process.exitCode=result.status??1

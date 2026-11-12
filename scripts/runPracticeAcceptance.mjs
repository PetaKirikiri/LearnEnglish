import {spawnSync} from 'node:child_process'
const focused=[
 'src/race/adaptiveExposureRegression.test.ts',
 'src/race/testing/blueprintIntegrity.test.ts',
 'src/race/GeneratedPractice.test.tsx',
 'src/race/PhonePractice.test.tsx',
 'src/race/PracticeStage.test.tsx',
 'src/classroom/GeneratedClassroomPractice.test.tsx',
 'src/learning/wordProgress/learningLifecycle.test.ts',
 'src/learning/wordProgress/store.test.ts',
]
const {PROGRESSION_CHECKPOINT: _checkpoint,...freshEnvironment}=process.env
// Sequential local checks avoid build/test CPU contention and never use a cloud runner.
for(const args of [
 ['node_modules/vitest/vitest.mjs','run',...focused,'--maxWorkers=1','--testTimeout=30000'],
 ...['1','2','3','4','5','6','identify','location','destination','determiners'].map(bank=>['--import','tsx','scripts/auditPracticeContrasts.ts',bank]),
 ['--import','tsx','scripts/runProgressionAcceptance.ts'],
]){
 const result=spawnSync(process.execPath,args,{stdio:'inherit',env:freshEnvironment})
 if(result.error)throw result.error
 if(result.status!==0)process.exit(result.status??1)
}
console.log('PASS: all local practice acceptance checks')

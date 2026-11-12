import {spawnSync} from 'node:child_process'
const focused=[
 'src/race/adaptiveExposureRegression.test.ts',
 'src/race/wordHierarchy.test.ts',
 'src/race/practiceForecast.test.ts',
 'src/race/queuedAudio.test.ts',
 'src/race/lessonPracticeTemplate.test.ts',
 'src/race/identification.test.tsx',
 'src/learning/wordProgress/submitAttempt.test.ts',
 'src/race/blueprintRecipe.test.ts',
 'server/sentenceAudio.test.ts',
 'src/audio/sentenceAudio.test.ts',
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
console.log('Checking blueprint slot-serving architecture first; sentence banks are forbidden.')
for(const args of [
 ['node_modules/vitest/vitest.mjs','run','src/race/blueprintServingArchitecture.test.ts','--maxWorkers=1'],
 ['node_modules/vitest/vitest.mjs','run',...focused,'--maxWorkers=1','--testTimeout=30000'],
 ['--import','tsx','scripts/runProgressionAcceptance.ts'],
]){
 const result=spawnSync(process.execPath,args,{stdio:'inherit',env:freshEnvironment})
 if(result.error)throw result.error
 if(result.status!==0)process.exit(result.status??1)
}
console.log('PASS: all local practice acceptance checks')

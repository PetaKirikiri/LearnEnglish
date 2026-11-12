import {vi} from 'vitest'
/** Test-only tripwire. No substitute words, questions or selector are provided.
 * Calling a whole-sentence catalogue is itself a contract failure, even when cached.
 * The real phone/classroom entry points must fulfil constrained blueprint slots. */
vi.mock('../generatedPracticeContent',async importOriginal=>{
 const actual=await importOriginal<typeof import('../generatedPracticeContent')>()
 const forbidden=(name:string)=>():never=>{throw new Error(`Blueprint slot-serving violation: ${name} requested a whole sentence bank. Request compatible words for the blueprint slots instead; cached sentence banks are forbidden too.`)}
 return {...actual,composeQuestion:vi.fn(actual.composeQuestion),
  practiceCandidates:forbidden('practiceCandidates'),
  generatedCandidates:forbidden('generatedCandidates'),
  structureCandidates:forbidden('structureCandidates'),
  allPracticeCandidates:forbidden('allPracticeCandidates'),
  determinerCandidates:forbidden('determinerCandidates'),
 }
})

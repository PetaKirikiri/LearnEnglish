// @vitest-environment happy-dom
import './testing/forbidSentenceBanks'
import {it} from 'vitest'
import {runProgressionAcceptance} from './testing/progressionAcceptance'
const exhaustive=process.env.RUN_FULL_PROGRESSION_AUDIT==='1'?it:it.skip
exhaustive('walks the real shared selector with presentation, answers and blueprint integrity',runProgressionAcceptance,3600000)

import {readFileSync,existsSync} from 'node:fs'
import {expect,it} from 'vitest'
import {tonightMeaningQuestions,tonightJudgementQuestions} from './tonightQuestions'
import {lessonThreeRecordings} from './lessonThreeQuestions'
import {lessonTwoCatalogue} from '../classroom/wordCatalogue'
import {defaultGuide} from '../classroom/pronunciation/guides'
it('uses air conditioner with natural pronunciation and regenerated recordings across lessons',()=>{
 expect(lessonTwoCatalogue.some(w=>w.word==='air conditioner')).toBe(true)
 expect(lessonTwoCatalogue.some(w=>w.word==='aircon')).toBe(false)
 expect(defaultGuide('air conditioner').english.syllables).toEqual(['air','con','di','tion','er'])
 expect(defaultGuide('air conditioner').thai.syllables).toEqual(['แอร์','คัน','ดิ','ชัน','เนอร์'])
 expect(existsSync('public/classroom/icons/level-one/air-conditioner.png')).toBe(true)
 const clips=[...tonightMeaningQuestions.map(q=>({audioUrl:q.audioUrl,spokenText:q.english})),...lessonThreeRecordings].filter(q=>/\bair conditioner\b/.test(q.spokenText))
 expect(clips).toHaveLength(10)
 for(const clip of clips){
  const parts=clip.audioUrl!.split('/'),name=parts.pop()!
  const manifest=JSON.parse(readFileSync(`public${parts.join('/')}/voice-manifest.json`,'utf8'))
  expect(manifest[name].text).toBe(clip.spokenText)
  expect(readFileSync(`public${clip.audioUrl}`).length).toBeGreaterThan(4800)
 }
 expect(tonightJudgementQuestions.some(q=>/aircon/.test(q.english))).toBe(false)
})

import {renderToStaticMarkup} from 'react-dom/server'
import {expect,it} from 'vitest'
import LanguageQuadrant,{quadrantLayout,type LanguageDocument} from './LanguageQuadrant'
import {actionPracticeQuestions} from '../../race/actionPracticeContent'
import {rankQuadrantCandidates} from './curriculumRequest'
const document:LanguageDocument={english:'Where is my shoe?',thai:'รองเท้าของฉันอยู่ที่ไหน',construction:'question',units:[{english:'Where',thai:'ที่ไหน',role:'question'},{english:'is',thai:'อยู่',role:'be'},{english:'my',thai:'ของฉัน',role:'determiner'},{english:'shoe?',thai:'รองเท้า',role:'object'}]}
it('renders every reviewed action sentence in each language and fade mode',()=>{
 for(const q of actionPracticeQuestions)for(const presentation of [{english:false},{icons:false},{thaiMeanings:false,thaiTranslation:true},{fadeMode:true,keepIconsWhenFading:true}]){
  const html=renderToStaticMarkup(<LanguageQuadrant request={{document:{...q,construction:q.level===4?'action-question':'action-answer'},presentation}}/>)
  expect(html).toContain('matrix-layout')
  if(presentation.english===false)expect(html).not.toContain('example-source')
  if(presentation.icons===false)expect(html).not.toContain('cw-game-icon')
 }
})
it('independently controls Thai layers, icons and source text',()=>{
 const html=renderToStaticMarkup(<LanguageQuadrant request={{document,presentation:{english:false,icons:false,thaiMeanings:true,thaiTranslation:false}}}/>)
 expect(html).toContain('รองเท้า');expect(html).not.toContain('example-source');expect(html).not.toContain('example-translation');expect(html).not.toContain('Where');expect(html).not.toContain('cw-game-icon')
 const translation=renderToStaticMarkup(<LanguageQuadrant request={{document,presentation:{thaiMeanings:false,thaiTranslation:true}}}/>)
 expect(translation).toContain('example-translation');expect(translation).not.toContain('example-gloss')
})
it('uses supplied user scores to fully hide learned words without revealing Thai',()=>{
 const html=renderToStaticMarkup(<LanguageQuadrant scores={{'en:where':25}} request={{document,presentation:{fadeMode:true,keepIconsWhenFading:true}}}/>)
 expect(html).toContain('opacity:0');expect(html).not.toContain('example-gloss');expect(html).not.toContain('example-translation');expect(html).toContain('cw-game-icon')
})
it('rejects mixed noun cards and unsupported structure rather than guessing',()=>{
 expect(()=>quadrantLayout({...document,english:'an apple',construction:'noun-phrase',units:[{english:'an apple',thai:'แอปเปิล',role:'object'}]})).toThrow('Determiners')
 expect(()=>quadrantLayout({...document,construction:'action-answer'})).toThrow('Unsupported')
})
it('restricts generated candidates by curriculum and ranks by familiar-word share',()=>{
 const candidates=[{document,vocabularyLesson:1},{document:{...document,construction:'action-question' as const},vocabularyLesson:1},{document,vocabularyLesson:4}]
 const ranked=rankQuadrantCandidates(candidates,{vocabularyThroughLesson:2,allowedStructures:['question'],familiarWordShare:.5},{'en:where':25,'en:is':10})
 expect(ranked).toHaveLength(1);expect(ranked[0].familiarShare).toBe(.5)
 expect(()=>rankQuadrantCandidates(candidates,{vocabularyThroughLesson:2,allowedStructures:[],familiarWordShare:2})).toThrow()
})
it('renders a description as a separate fadeable card within the noun group',()=>{
 const d:LanguageDocument={english:'the red bag',thai:'',construction:'noun-phrase',units:[{english:'the',thai:'',role:'determiner'},{english:'red',thai:'',role:'description'},{english:'bag',thai:'',role:'object'}]}
 const html=renderToStaticMarkup(<LanguageQuadrant scores={{'en:red':25}} request={{document:d,presentation:{fadeMode:true,keepIconsWhenFading:true}}}/>)
 expect(html).toContain('data-group-size="3"')
 expect(html).toContain('description-picture')
 expect(html).toContain('opacity:0')
 expect(html).toContain('bag')
})

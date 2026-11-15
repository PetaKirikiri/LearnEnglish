import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {existsSync} from 'node:fs'
import {resolve} from 'node:path'
import DeterminerIcon from './DeterminerIcon'
import WordSlotIcon from './WordSlotIcon'
import {ActionIcon} from './ActionVocabularyIcon'
import {wordHierarchies} from '../../race/wordHierarchy'

it('routes every taught determiner through the same meaning-specific artwork in slots and vocabulary lists',()=>{
 const sources=new Map<string,string>()
 for(const word of wordHierarchies.determiner){
  const direct=renderToStaticMarkup(<DeterminerIcon word={word}/>),slot=renderToStaticMarkup(<WordSlotIcon slot={2} word={word}/>)
  expect(slot,word).toBe(direct)
  expect(direct,word).toContain('data-determiner="'+word+'"')
  expect(direct,word).not.toContain('mystery-apple')
  const paths=[...direct.matchAll(/src="([^"]+)"/g)].map(match=>match[1])
  expect(paths.length,word).toBeGreaterThan(0)
  for(const path of paths)expect(existsSync(resolve('public',path.slice(1))),word+': '+path).toBe(true)
  sources.set(word,paths.join('|'))
 }
 expect(sources.get('a')).toBe(sources.get('an'))
 expect(new Set(sources.values()).size).toBe(wordHierarchies.determiner.length-1)
})
it('does not place the clock sprite behind transparent action artwork',()=>{
 const html=renderToStaticMarkup(<ActionIcon word="holding"/>)
 expect(html).toContain('background:none')
 expect(html).toContain('/actions/focused/holding.png')
})
it('uses quantity rather than a question mark for some',()=>{
 const html=renderToStaticMarkup(<DeterminerIcon word="some"/>)
 expect([...html.matchAll(/<img /g)]).toHaveLength(1)
 expect(html).toContain('/determiners/v3/some.png')
 expect(html).toContain('an unspecified group')
 expect(html).not.toContain('?')
})

import {existsSync} from 'node:fs'
import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {descriptions,descriptionStages} from './everydayVocabulary'
import DescriptionPicture from './DescriptionPicture'
import {adjectiveFitsNoun,adjectiveThaiForNoun} from './sentenceRules/adjectiveSemantics'
import {generatedNumberCatalogue} from '../race/numberCatalogue'
import {nounPhraseUnits} from './sentenceMatrix/nounPhrase'

it('keeps the original order, with one shared entry, icon and usable contrast per adjective',()=>{
 const words=descriptionStages.flat()
 expect(words.slice(0,12)).toEqual(['red','blue','big','small','hot','cold','green','yellow','black','white','tall','short'])
 expect(words).toHaveLength(36)
 expect(new Set(words).size).toBe(words.length)
 expect(descriptions.map(d=>d.word)).toEqual(words)
 for(const d of descriptions){
  const nouns=generatedNumberCatalogue.filter(n=>adjectiveFitsNoun(d.word,n)&&adjectiveFitsNoun(d.opposite,n))
  expect(nouns.length,d.word+' needs an available noun contrast').toBeGreaterThan(0)
  const artwork=`/classroom/icons/adjectives/3d/${d.word}.png`
  const html=renderToStaticMarkup(<DescriptionPicture word={d.word}/>)
  expect(html).toContain(artwork)
  expect(html).not.toContain('<svg')
  expect(existsSync('public'+artwork),d.word+' artwork').toBe(true)
  for(const noun of nouns){
   expect(()=>nounPhraseUnits({noun:noun.word,nounThai:noun.thai,description:{english:d.word,thai:adjectiveThaiForNoun(d.word,noun)}})).not.toThrow()
  }
 }
})
it('constrains new descriptions to meaningful subjects and objects, including plurals',()=>{
 for(const [adj,noun] of [['happy','women'],['sad','children'],['clean','shirts'],['wet','towel'],['new','phone'],['old','books'],['full','bottle'],['empty','bags'],['open','door'],['closed','window'],['heavy','table'],['light','bag'],['fast','car'],['slow','bus'],['soft','bread'],['hard','chair'],['thick','book'],['thin','towel'],['pink','shirt'],['purple','bag'],['orange','cup'],['brown','shoes']])expect(adjectiveFitsNoun(adj,noun),adj+' '+noun).toBe(true)
 for(const [adj,noun] of [['happy','cup'],['sad','book'],['full','man'],['empty','apple'],['open','water'],['closed','woman'],['heavy','coffee'],['light','water'],['pink','man'],['fast','bread'],['old','woman']])expect(adjectiveFitsNoun(adj,noun),adj+' '+noun).toBe(false)
})

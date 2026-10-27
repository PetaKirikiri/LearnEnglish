import { expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import VocabularyPicture from './VocabularyPicture'
import { pluralVocabulary, pairVocabulary } from '../race/pluralVocabulary'

it('pictures every lesson noun with one item versus multiple items', () => {
  for (const item of pluralVocabulary) {
    expect(renderToStaticMarkup(<VocabularyPicture word={item.singular}/>).match(/<svg/g)).toHaveLength(1)
    expect(renderToStaticMarkup(<VocabularyPicture word={item.plural}/>).match(/<svg/g)).toHaveLength(2)
  }
  for (const item of pairVocabulary) {
    // One pair is still grammatically plural; do not imply two pairs are required.
    expect(renderToStaticMarkup(<VocabularyPicture word={item.plural}/>).match(/<svg/g)).toHaveLength(1)
  }
  expect(renderToStaticMarkup(<VocabularyPicture word="book"/>)).toContain('data-word="book"')
})

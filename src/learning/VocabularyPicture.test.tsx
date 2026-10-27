import { expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import VocabularyPicture from './VocabularyPicture'
import { pluralVocabulary, pairVocabulary } from '../race/pluralVocabulary'

it('pictures every lesson noun with one item versus multiple items', () => {
  for (const item of pluralVocabulary) {
    expect(renderToStaticMarkup(<VocabularyPicture word={item.singular}/>).match(/<(?:svg|img)\b/g)).toHaveLength(1)
    expect(renderToStaticMarkup(<VocabularyPicture word={item.plural}/>).match(/<img\b/g)).toHaveLength(2)
  }
  for (const item of pairVocabulary) {
    // One pair is still grammatically plural; do not imply two pairs are required.
    expect(renderToStaticMarkup(<VocabularyPicture word={item.plural}/>).match(/<(?:svg|img)\b/g)).toHaveLength(1)
  }
  expect(renderToStaticMarkup(<VocabularyPicture word="book"/>)).toContain('data-word="book"')
})

it('uses the same artwork for singular and plural so only quantity changes', () => {
  for (const item of pluralVocabulary) {
    const single = renderToStaticMarkup(<VocabularyPicture word={item.singular}/>)
    const plural = renderToStaticMarkup(<VocabularyPicture word={item.plural}/>)
    const source = single.match(/<img[^>]+src="([^"]+)"/)?.[1]
    expect(source).toBeTruthy()
    expect(plural.match(/<img[^>]+src="([^"]+)"/g)).toHaveLength(2)
    expect(plural.match(/<img[^>]+src="([^"]+)"/g)?.every(image => image.includes(source!))).toBe(true)
  }
})

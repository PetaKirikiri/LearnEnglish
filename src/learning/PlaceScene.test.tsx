import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import PlaceScene from './PlaceScene'
import { examPracticeQuestions } from './examPracticeContent'

describe('answerable picture-based place questions', () => {
  it('gives every place question a visible scene and exactly one matching target', () => {
    const questions = examPracticeQuestions.filter(q => q.examCategory === 'grammar')
    expect(questions).toHaveLength(10)
    for (const q of questions) {
      expect(q.placeRelation).toBe(q.answer)
      const markup = renderToStaticMarkup(<PlaceScene relation={q.placeRelation!} />)
      expect(markup).toContain('role="img"')
      expect(markup).toContain('data-object="ball"')
      expect(markup).toContain('lang="th"')
      expect(q.prompt).toMatch(/^The ball (is|moves) _____ the box(es)?\.$/)
      expect(q.choices.filter(choice => choice === q.placeRelation)).toHaveLength(1)
      for (const pair of [['above','over'],['beside','next to']]) expect(pair.every(word=>q.choices.includes(word))).toBe(false)
    }
  })
  it('makes front and behind distinct through occlusion, and between uses two boxes', () => {
    const front = renderToStaticMarkup(<PlaceScene relation="in front of" />)
    const behind = renderToStaticMarkup(<PlaceScene relation="behind" />)
    expect(front.indexOf('data-object="ball"')).toBeGreaterThan(front.indexOf('data-object="box"'))
    expect(behind.indexOf('data-object="ball"')).toBeLessThan(behind.indexOf('data-object="box"'))
    expect(renderToStaticMarkup(<PlaceScene relation="between" />).match(/data-object="box"/g)).toHaveLength(2)
  })
})

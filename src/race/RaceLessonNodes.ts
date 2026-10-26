import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ExampleView, HolidayWordsView } from './RaceLessonNodeViews'

// Port of connectors/src/components/lessons/lessonLayoutNode.ts. The same
// nested layout nodes stay in Yjs, so editing does not flatten the lesson.
const variants = ['section', 'teaching', 'beat', 'hero', 'row', 'grid', 'card', 'soft', 'star', 'label', 'statement', 'answer', 'vocabulary']
const variant = (value: unknown) => typeof value === 'string' && variants.includes(value) ? value : 'section'
export const LessonLayoutNode = Node.create({
  name: 'lessonLayout', group: 'block', content: 'block+', defining: true,
  addAttributes() { return { variant: { default: 'section', parseHTML: element => variant(element.getAttribute('data-lesson-layout')) }, anchor: { default: null, parseHTML: element => element.id || null } } },
  parseHTML() { return [{ tag: 'section[data-lesson-layout]' }] },
  renderHTML({ HTMLAttributes }) {
    const { variant: value, anchor, ...attributes } = HTMLAttributes
    return ['section', mergeAttributes(attributes, { 'data-lesson-layout': variant(value), ...(typeof anchor === 'string' && /^[a-z-]+$/.test(anchor) ? { id: anchor } : {}) }), 0]
  },
})
export const LessonExampleNode = Node.create({
  name: 'lessonExample', group: 'block', atom: true,
  addAttributes() { return {
    english: { default: '', parseHTML: element => element.getAttribute('data-english') ?? '' },
    thai: { default: '', parseHTML: element => element.getAttribute('data-thai') ?? '' },
    units: { default: [], parseHTML: element => { try { return JSON.parse(element.getAttribute('data-units') ?? '[]') } catch { return [] } } },
  } },
  parseHTML() { return [{ tag: 'div[data-lesson-example]' }] },
  renderHTML({ node }) { return ['div', { 'data-lesson-example': '', 'data-english': node.attrs.english, 'data-thai': node.attrs.thai, 'data-units': JSON.stringify(node.attrs.units) }] },
  addNodeView() { return ReactNodeViewRenderer(ExampleView) },
})
export const HolidayWordsNode = Node.create({
  name: 'holidayWords', group: 'block', atom: true,
  parseHTML() { return [{ tag: 'div[data-holiday-words]' }] },
  renderHTML() { return ['div', { 'data-holiday-words': '' }] },
  addNodeView() { return ReactNodeViewRenderer(HolidayWordsView) },
})
export const raceLessonExtensions = [LessonLayoutNode, LessonExampleNode, HolidayWordsNode]

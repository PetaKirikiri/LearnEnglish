// @vitest-environment happy-dom
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import * as Y from 'yjs'
import { expect, it } from 'vitest'
import { raceLessonExtensions } from './RaceLessonNodes'
import { seedRaceLesson } from '../../server/raceLessonDocument'
import { holidayVocabulary } from './holidayVocabulary'
import { holidayMeaningQuestions, holidayQuestions } from './holidayQuestions'

it('opens the Ka Piki style document without flattening layouts or losing contextual examples', () => {
  const doc = seedRaceLesson()
  const editor = new Editor({ extensions: [StarterKit.configure({ undoRedo: false }), ...raceLessonExtensions, Collaboration.configure({ document: doc, field: 'default' })] })
  try {
    const json = editor.getJSON()
    expect(json.content?.filter(node => node.type === 'lessonLayout')).toHaveLength(5)
    const text = JSON.stringify(json)
    expect(text).toContain('lessonExample')
    expect(text).toContain('holidayWords')
    expect(text).toContain('โรงแรมอยู่ที่ไหน')
    let paragraph = 0
    editor.state.doc.descendants((node, position) => { if (!paragraph && node.type.name === 'paragraph') paragraph = position + 1 })
    editor.commands.insertContentAt(paragraph, 'Teacher edit ')
    const reopened = new Y.Doc(); Y.applyUpdate(reopened, Y.encodeStateAsUpdate(doc))
    expect(reopened.getXmlFragment('default').toString()).toContain('Teacher edit')
    reopened.destroy()
  } finally { editor.destroy(); doc.destroy() }
})
it('teaches the exact vocabulary used by both race activities', () => {
  expect(holidayVocabulary).toHaveLength(holidayMeaningQuestions.length)
  for (const { word, thai } of holidayVocabulary) {
    expect(holidayMeaningQuestions.find(q => q.english === `Where is the ${word}?`)?.answers[0][0].text).toBe(`${thai}อยู่ที่ไหน`)
    expect(holidayQuestions.filter(q => q.id.startsWith(`race-where-${word}-`))).toHaveLength(3)
  }
})

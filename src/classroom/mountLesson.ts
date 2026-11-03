import {lessonId,requestedLesson} from '../learning/lessonRequests'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import Lesson from './lesson'
import type { LessonPage } from './lessonOne'

const root: Root = import.meta.hot?.data.root ?? createRoot(document.getElementById('note')!)
if (import.meta.hot) import.meta.hot.dispose(data => { data.root = root })
export function renderLesson(page: LessonPage) {
  try { root.render(createElement(Lesson, { page, lessonId:lessonId(requestedLesson(location.search)) })) }
  catch(error) { root.render(createElement('p', {role:'alert'}, (error as Error).message)) }
}

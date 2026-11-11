import type {ReactNode} from 'react'
import {t} from './language'
import {lessonTitles} from './lessonOne'
import type {LessonPage} from './lessonOne'

export default function PanelHeader({ page, action, lessonNumber = 1 }: { page: LessonPage; action?: ReactNode; lessonNumber?:number }) {
  return <header className="cw-panel-header"><span className="cw-panel-lesson">{t(`Lesson ${String(lessonNumber).padStart(2,'0')}`)}</span><div className="cw-panel-header-main"><h1 id="note-title">{lessonNumber===6?'What is this?':lessonNumber===5?'Where are you going?':lessonNumber===4?'I am eating…':lessonNumber===3?'Where…? · What…doing?':t(lessonTitles[page])}</h1>{action}</div></header>
}

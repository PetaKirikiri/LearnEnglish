import { classroomMatrices } from './matrixLessons'
import { lessonTwoStages } from './lessonTwoContent'
import { LanguageSwitch } from './LanguageSwitch'
import { useLanguage, t } from './language'
import { useState } from 'react'
import type { ReactNode } from 'react'
import PatternComparison from '../learning/sentenceMatrix/PatternComparison'
type HolidayWord = string
import Icon from '../ui/Icon'
import SentenceLine from './SentenceLine'
import ClassroomRace from './ClassroomRace'
import { lessonTitles } from './lessonOne'
import type { LessonPage } from './lessonOne'
import '../learning/sentenceSlotBuilder.css'
import './lesson.css'



function Heading({ page, children }: { page: LessonPage; children?: ReactNode }) {
  return <header className="lesson-heading cw-heading"><p className="cw-lesson-label">01 <span/> Where is the…?</p><h1 id="note-title">{t(lessonTitles[page])}</h1>{children && <p className="lead">{children}</p>}</header>
}

function PanelHeader({ page, action, lessonTwo = false }: { page: LessonPage; action?: ReactNode; lessonTwo?:boolean }) {
  return <header className="cw-panel-header"><span className="cw-panel-lesson">{t(lessonTwo ? 'Lesson 02' : 'Lesson 01')}</span><div className="cw-panel-header-main"><h1 id="note-title">{t(lessonTitles[page])}</h1>{action}</div></header>
}

function Recall({ word, onWord }: { word: HolidayWord; onWord: (word: HolidayWord) => void }) {
  return <div className="cw-sentence-panel"><PanelHeader page="recall"/><div className="cw-sentence-workspace"><SentenceLine lesson={classroomMatrices['lesson-1']} word={word} onWord={onWord}/></div></div>
}

function Meaning({ word, onWord }: { word: HolidayWord; onWord: (word: HolidayWord) => void }) {
  return <div className="cw-sentence-panel"><PanelHeader page="idea"/><div className="cw-sentence-workspace"><SentenceLine lesson={classroomMatrices['lesson-1']} word={word} onWord={onWord}/></div></div>
}

function WorkedExample({ word, onWord }: { word: HolidayWord; onWord: (word: HolidayWord) => void }) {
  return <div className="cw-sentence-panel"><PanelHeader page="example"/><div className="cw-sentence-workspace"><SentenceLine lesson={classroomMatrices['lesson-1']} word={word} onWord={onWord}/></div></div>
}

function Mistake({ word }: { word: HolidayWord }) {
  return <><Heading page="mistake">{t('ในรูปแบบนี้ ต้องมีทั้ง')} <span lang="en">is</span> {t('และ')} <span lang="en">the</span></Heading><PatternComparison lesson={classroomMatrices['lesson-1']} word={word}/></>
}

function Review({ word, onWord }: { word: HolidayWord; onWord:(word:string)=>void }) {
  return <><Heading page="review">{t('จำรูปแบบ แล้วเปลี่ยนแค่คำท้าย')}</Heading><div className="cw-centre"><SentenceLine lesson={classroomMatrices['lesson-1']} word={word} onWord={onWord}/><div className="cw-takeaways"><p><strong lang="en">Where</strong><span>{t('ถามว่าที่ไหน')}</span></p><p><strong lang="en">is the</strong><span>{t('เก็บสองคำนี้ไว้')}</span></p><p><strong lang="en">{word}</strong><span>{t('เปลี่ยนสิ่งที่ถามหา')}</span></p></div></div><a className="cw-race-entry" href="/english/race"><Icon name="flag"/><span>{t('เข้าห้องแข่ง')}</span><Icon name="arrow"/></a></>
}

export default function Lesson({ page, lessonId = 'lesson-1' }: { page: LessonPage; lessonId?:string }) {
  const language = useLanguage()
  const [word, setWord] = useState<HolidayWord>('hotel')
  const [lessonTwoWord, setLessonTwoWord] = useState('shoes')
  if(lessonId==='lesson-2') return <div lang={language} style={{display:'contents'}}><LanguageSwitch/>{page==='practice'?<ClassroomRace lessonId="lesson-2" stages={lessonTwoStages}/>:<div className="cw-sentence-panel"><PanelHeader page={page} lessonTwo/><div className="cw-sentence-workspace"><SentenceLine lesson={classroomMatrices['lesson-2']} word={lessonTwoWord} onWord={setLessonTwoWord}/></div></div>}</div>
  return <div lang={language} style={{display:'contents'}}><LanguageSwitch/>{page === 'recall' ? <Recall word={word} onWord={setWord}/> : page === 'idea' ? <Meaning word={word} onWord={setWord}/> : page === 'example' ? <WorkedExample word={word} onWord={setWord}/> : page === 'mistake' ? <Mistake word={word}/> : page === 'practice' ? <ClassroomRace/> : <Review word={word} onWord={setWord}/>}</div>
}

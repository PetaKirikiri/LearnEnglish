import QuestionReportsPage from './pages/QuestionReportsPage'
import { useMemo, useState } from 'react'
import { useAuth } from './auth/authContext'
import { readings } from './content/readings'
import { buildDeterminerData } from './lib/determinerData'
import { loadOrBuildWordData } from './lib/wordData'
import DeterminersPage from './pages/DeterminersPage'
import CourseScopePage from './pages/CourseScopePage'
import ReadingPage from './pages/ReadingPage'
import WordDataPage from './pages/WordDataPage'
import LoginPage from './pages/LoginPage'
import StudentHomePage from './pages/StudentHomePage'
import ContentLibraryPage from './pages/ContentLibraryPage'
import MembersTablePage from './pages/MembersTablePage'
import QuestionsTablePage from './pages/QuestionsTablePage'
import LearnerProgressPage from './pages/LearnerProgressPage'
import { useLearningActivity } from './learning/useLearningActivity'
import LeaderboardPage from './pages/LeaderboardPage'
import TrainingPlanPage from './pages/TrainingPlanPage'
import { appDestination } from './auth/appAccess'

export default function App() {
  const { loading, user, displayName, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<
    'members' | 'library' | 'reports' | 'leaderboard' | 'progress' | 'training-plan' | 'content' | 'stories' | 'word-data' | 'syllabus'
  >(() => {
    const tab = window.location.hash.slice(1)
    switch (tab) {
      case 'members': case 'library': case 'reports': case 'leaderboard': case 'progress':
      case 'training-plan': case 'content': case 'stories': case 'word-data': case 'syllabus': return tab
      default: return 'members'
    }
  })
  const [activeWordDataView, setActiveWordDataView] = useState<
    'all-words' | 'determiners'
  >('all-words')
  const wordData = useMemo(() => loadOrBuildWordData(readings), [])
  const determiners = useMemo(() => buildDeterminerData(wordData), [wordData])
  const destination = user ? appDestination(user.id, window.location.pathname) : 'student'
  const syncState = useLearningActivity(user?.id, displayName, destination === 'student')

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-bold text-slate-500">
        Opening EnglishSuccess…
      </main>
    )
  }

  if (!user) return <LoginPage />

  if (destination === 'student') {
    return (
      <StudentHomePage
        userId={user.id}
        syncState={syncState}
        displayName={displayName ?? 'Player'}
        onSignOut={() => void signOut()}
      />
    )
  }

  return (
    <main className="admin-sheet min-h-screen bg-white px-4 py-5 text-slate-900 sm:px-6">
      <nav aria-label="Main sections" className="mb-4 flex items-center gap-1 border-b border-slate-300">
        <a href="/app" aria-label="Student app" title="Student app" className="flex h-11 w-11 items-center justify-center text-xl text-slate-500">‹</a>
        {(['members','content'] as const).map(id=><button key={id} aria-pressed={activeTab===id} onClick={()=>{setActiveTab(id);window.history.replaceState(null,'',`#${id}`)}} className={`min-h-11 border-b-2 px-4 text-sm font-semibold ${activeTab===id ? 'border-teal-800 text-teal-900' : 'border-transparent text-slate-500'}`}>{id==='members' ? 'Members' : 'Content'}</button>)}
      </nav>

      {activeTab === 'members' ? (
        <MembersTablePage />
      ) : activeTab === 'reports' ? (
        <QuestionReportsPage />
      ) : activeTab === 'leaderboard' ? (
        <LeaderboardPage />
      ) : activeTab === 'progress' ? (
        <LearnerProgressPage />
      ) : activeTab === 'training-plan' ? (
        <TrainingPlanPage />
      ) : activeTab === 'content' ? (
        <QuestionsTablePage />
      ) : activeTab === 'library' ? (
        <ContentLibraryPage />
      ) : activeTab === 'stories' ? (
        <ReadingPage />
      ) : activeTab === 'syllabus' ? (
        <CourseScopePage />
      ) : (
        <div>
          <nav
            aria-label="Word data sections"
            className="mx-auto mb-6 flex max-w-3xl gap-2 border-b border-slate-300"
          >
            <button
              type="button"
              aria-pressed={activeWordDataView === 'all-words'}
              onClick={() => setActiveWordDataView('all-words')}
              className={`border-b-3 px-4 py-3 text-sm font-bold transition ${
                activeWordDataView === 'all-words'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-blue-700'
              }`}
            >
              All Words ({wordData.uniqueWords})
            </button>
            <button
              type="button"
              aria-pressed={activeWordDataView === 'determiners'}
              onClick={() => setActiveWordDataView('determiners')}
              className={`border-b-3 px-4 py-3 text-sm font-bold transition ${
                activeWordDataView === 'determiners'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-blue-700'
              }`}
            >
              Determiners ({determiners.length})
            </button>
          </nav>

          {activeWordDataView === 'all-words' ? (
            <WordDataPage wordData={wordData} />
          ) : (
            <DeterminersPage determiners={determiners} />
          )}
        </div>
      )}
    </main>
  )
}

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

export default function App() {
  const { loading, user, displayName, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<
    'stories' | 'word-data' | 'syllabus'
  >('stories')
  const [activeWordDataView, setActiveWordDataView] = useState<
    'all-words' | 'determiners'
  >('all-words')
  const wordData = useMemo(() => loadOrBuildWordData(readings), [])
  const determiners = useMemo(() => buildDeterminerData(wordData), [wordData])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-bold text-slate-500">
        Opening FIFA English…
      </main>
    )
  }

  if (!user) return <LoginPage />

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between gap-4 text-sm">
        <p className="truncate text-slate-600">
          Signed in as <span className="font-bold text-slate-900">{displayName ?? 'Player'}</span>
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="shrink-0 font-bold text-blue-700 hover:text-blue-900"
        >
          Sign out
        </button>
      </div>
      <nav
        aria-label="Main sections"
        className="mx-auto mb-6 flex max-w-3xl rounded-2xl bg-white p-1.5 shadow-md"
      >
        <button
          type="button"
          aria-pressed={activeTab === 'stories'}
          onClick={() => setActiveTab('stories')}
          className={`flex-1 rounded-xl px-5 py-3 text-sm font-bold transition ${
            activeTab === 'stories'
              ? 'bg-blue-700 text-white'
              : 'text-slate-600 hover:bg-blue-50'
          }`}
        >
          Stories
        </button>
        <button
          type="button"
          aria-pressed={activeTab === 'word-data'}
          onClick={() => setActiveTab('word-data')}
          className={`flex-1 rounded-xl px-5 py-3 text-sm font-bold transition ${
            activeTab === 'word-data'
              ? 'bg-blue-700 text-white'
              : 'text-slate-600 hover:bg-blue-50'
          }`}
        >
          Word Data
        </button>
        <button
          type="button"
          aria-pressed={activeTab === 'syllabus'}
          onClick={() => setActiveTab('syllabus')}
          className={`flex-1 rounded-xl px-3 py-3 text-sm font-bold transition sm:px-5 ${
            activeTab === 'syllabus'
              ? 'bg-blue-700 text-white'
              : 'text-slate-600 hover:bg-blue-50'
          }`}
        >
          Syllabus
        </button>
      </nav>

      {activeTab === 'stories' ? (
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

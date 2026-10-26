import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider.tsx'
import './index.css'
import './game-theme.css'
import LanguageGate from './content/LanguageGate'
import { lazy, Suspense } from 'react'
import { isHotelLineEntry } from './hotel/lineEntry'
import { isPadelLineEntry } from './padel/lineEntry'
import { isCoachLineEntry } from './coach/lineEntry'
import { isEnglishLineEntry } from './english/lineEntry'
import { isSuccessRoute } from './success/course'
const SuccessPage = lazy(() => import('./success/SuccessPage'))
const RaceLessonPage = lazy(() => import('./race/RaceLessonPage'))
const isRaceLesson = window.location.pathname.replace(/\/$/, '') === '/english/race/lesson'
const RacePage = lazy(() => import('./race/RacePage'))
const RaceAdminPage = lazy(() => import('./race/RaceAdminPage'))
const HorsePreviewPage = lazy(() => import('./race/HorsePreviewPage'))
const RaceDemoPage = lazy(() => import('./race/RaceDemoPage'))
const isRaceDemo = window.location.pathname === '/english/race/demo'
const isRaceAdmin = window.location.pathname === '/english/race/admin'
const isHorsePreview = window.location.pathname === '/english/race/horses'
const isRace = /^\/english\/race(?:\/|$)/.test(window.location.pathname)
const CoachPage = lazy(() => import('./coach/CoachPage'))
const FimoPreviewPage = lazy(() => import('./fimo/FimoPreviewPage'))
const isFimoPreview = window.location.pathname === '/english/fimo-preview'
const isCoach = /^\/padel-coach(?:\/|$)/.test(window.location.pathname) || isCoachLineEntry(window.location.search)
const HotelPage = lazy(() => import('./hotel/HotelPage'))
const PadelPage = lazy(() => import('./padel/PadelPage'))
const isPadel = /^\/padel(?:\/|$)/.test(window.location.pathname) || isPadelLineEntry(window.location.search)
const isHotel = /^\/hotel(?:\/|$)/.test(window.location.pathname) || isHotelLineEntry(window.location.search)
const isEnglish = /^\/english(?:\/|$)/.test(window.location.pathname) || isEnglishLineEntry(window.location.search)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isRaceLesson ? <Suspense fallback={<main>Opening…</main>}><RaceLessonPage /></Suspense> : isRaceAdmin ? <Suspense fallback={<main>Opening…</main>}><RaceAdminPage /></Suspense> : isRaceDemo ? <Suspense fallback={<main>Opening…</main>}><RaceDemoPage /></Suspense> : isHorsePreview ? <Suspense fallback={<main>Opening…</main>}><HorsePreviewPage /></Suspense> : isRace ? <Suspense fallback={<main>Opening…</main>}><RacePage /></Suspense> : <>
    {isSuccessRoute(window.location.pathname) ? <Suspense fallback={<main>Opening…</main>}><SuccessPage /></Suspense> : isFimoPreview ? <Suspense fallback={<main>Opening…</main>}><FimoPreviewPage /></Suspense> : isCoach ? <Suspense fallback={<main>Ouverture…</main>}><CoachPage /></Suspense> : isPadel ? <Suspense fallback={<main>Opening…</main>}><PadelPage /></Suspense> : isHotel || isEnglish ? <Suspense fallback={<main>Opening…</main>}><HotelPage courseId={isEnglish ? 'english' : 'hotel'} /></Suspense> : <LanguageGate><AuthProvider>
      <App />
    </AuthProvider></LanguageGate>}
    </>}
  </StrictMode>,
)

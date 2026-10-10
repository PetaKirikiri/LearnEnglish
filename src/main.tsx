import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider.tsx'
import './index.css'
import './game-theme.css'
import LanguageGate from './content/LanguageGate'
import { lazy, Suspense } from 'react'
import { isHotelLineEntry } from './hotel/lineEntry'
const HotelPage = lazy(() => import('./hotel/HotelPage'))
const isHotel = /^\/hotel(?:\/|$)/.test(window.location.pathname) || isHotelLineEntry(window.location.search)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isHotel ? <Suspense fallback={<main>Opening…</main>}><HotelPage /></Suspense> : <LanguageGate><AuthProvider>
      <App />
    </AuthProvider></LanguageGate>}
  </StrictMode>,
)

import App from './App'
import {AuthProvider} from './auth/AuthProvider'
import LanguageGate from './content/LanguageGate'
export default function AppEntry(){return <LanguageGate><AuthProvider><App/></AuthProvider></LanguageGate>}

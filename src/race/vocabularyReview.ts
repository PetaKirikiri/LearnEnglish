import {createElement} from 'react'
import {createRoot} from 'react-dom/client'
import VocabularyReview from './VocabularyProgressPage'
import './vocabularyReview.css'
createRoot(document.querySelector<HTMLDivElement>('#vocabulary-review')!).render(createElement(VocabularyReview))

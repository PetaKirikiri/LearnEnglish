import type {ReactNode} from 'react'

export type ClassroomNavIconName='students'|'whiteboard'|'testing'|'game'

// Soft, filled silhouettes keep the classroom navigation legible at small sizes.
const artwork:Record<ClassroomNavIconName,ReactNode>={
 students:<>
  <circle cx="32" cy="18" r="10"/><circle cx="12" cy="24" r="7"/><circle cx="52" cy="24" r="7"/>
  <path d="M18 56c-6 0-8-3-8-8 0-10 8-17 22-17s22 7 22 17c0 5-2 8-8 8H18ZM7 36c-5 2-7 7-6 12 1 4 4 5 8 5-1-2-2-5-1-8 0-4 2-7 4-10l-5 1Zm50 0-5-1c2 3 4 6 4 10 1 3 0 6-1 8 4 0 7-1 8-5 1-5-1-10-6-12Z"/>
 </>,
 whiteboard:<>
  <path fillRule="evenodd" d="M14 7h36c8 0 12 4 12 12v21c0 8-4 12-12 12H36v5h10a3 3 0 0 1 0 6H18a3 3 0 0 1 0-6h10v-5H14C6 52 2 48 2 40V19C2 11 6 7 14 7Zm1 8c-4 0-5 1-5 5v19c0 4 1 5 5 5h34c4 0 5-1 5-5V20c0-4-1-5-5-5H15Z"/>
  <rect x="17" y="22" width="29" height="6" rx="3"/><rect x="17" y="33" width="19" height="6" rx="3"/>
 </>,
 testing:<>
  <rect x="21" y="3" width="22" height="10" rx="5"/>
  <path fillRule="evenodd" d="M17 9v1c0 5 3 8 8 8h14c5 0 8-3 8-8V9c8 0 12 5 12 13v27c0 9-5 13-14 13H19C10 62 5 58 5 49V22C5 14 9 9 17 9Zm28 22a4 4 0 0 0-6-5L28 39l-5-5a4 4 0 0 0-6 6l8 8a4 4 0 0 0 6 0l14-17Z"/>
 </>,
 game:<path fillRule="evenodd" d="M20 14h24c8 0 12 4 15 13l4 17c3 13-8 17-15 9l-6-7H22l-6 7C9 61-2 57 1 44l4-17c3-9 7-13 15-13Zm-3 9a3 3 0 0 0-3 3v3h-3a3 3 0 0 0 0 6h3v3a3 3 0 0 0 6 0v-3h3a3 3 0 0 0 0-6h-3v-3a3 3 0 0 0-3-3Zm30 0a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-7 11a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/>,
}

export default function ClassroomNavIcon({name}:{name:ClassroomNavIconName}){
 return <svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" focusable="false">{artwork[name]}</svg>
}

import {useEffect,useRef,useState,type RefObject} from 'react'
import {flushSync} from 'react-dom'

/** One card-to-header transition and focus-return path for every construction. */
export default function useMatrixEducation(board:RefObject<HTMLElement|null>,explanationId:string,closePicker:()=>void){
  const [explaining,setExplaining]=useState<number|null>(null)
  const restoreSlot=useRef<number|null>(null)
  const motion = useRef<ViewTransition | null>(null)
  function explain(slot: number | null) {
    motion.current?.skipTransition()
    const selectedSlot = slot ?? explaining
    if (slot === null) restoreSlot.current = explaining
    const mark = () => {
      const source = board.current?.querySelector<HTMLElement>(`.example-unit-trigger[data-unit-index="${selectedSlot}"]`)
      const header = document.getElementById(explanationId)?.querySelector<HTMLElement>('.cw-word-heading')
      const target = header?.querySelector<HTMLElement>('.cw-simple-word-title')
      const surface = source ?? header
      if (surface) surface.style.viewTransitionName = 'classroom-word-surface'
      const icon = (source ?? target)?.querySelector<HTMLElement>('.cw-time-icon, .cw-game-icon, .vocabulary-picture')
      const word = (source ?? target)?.querySelector<HTMLElement>(source ? '.example-source' : 'h1')
      const gloss = (source ?? target)?.querySelector<HTMLElement>('.cw-word-gloss-text')
      if (gloss) gloss.style.viewTransitionName = 'classroom-word-gloss'
      if (icon) icon.style.viewTransitionName = 'classroom-word-icon'
      if (word) word.style.viewTransitionName = 'classroom-word-label'
    }
    const update = () => {
      flushSync(() => { closePicker(); setExplaining(slot) })
      mark()
    }
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      mark()
      document.documentElement.dataset.wordMotion = slot === null ? 'back' : 'open'
      const transition = document.startViewTransition(update)
      motion.current = transition
      const cleanup = () => {
        if (motion.current !== transition) return
        motion.current = null
        delete document.documentElement.dataset.wordMotion
        document.querySelectorAll<HTMLElement>('[style*="view-transition-name"]').forEach(element => {
          if (element.style.viewTransitionName.startsWith('classroom-word-')) element.style.removeProperty('view-transition-name')
        })
      }
      void transition.finished.then(cleanup, cleanup)
    } else flushSync(() => { closePicker(); setExplaining(slot) })
  }
  useEffect(() => {
    if (explaining === null && restoreSlot.current !== null) {
      board.current?.querySelector<HTMLButtonElement>(`.example-unit-trigger[data-unit-index="${restoreSlot.current}"]`)?.focus({preventScroll:true})
      restoreSlot.current = null
    }
  }, [explaining])
  return {explaining,explain}
}

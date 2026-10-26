import * as Y from 'yjs'
import { encodeDocument, mergeDocument, remoteOrigin } from '../portal/documentSync'

export type LessonSyncState = { ready: boolean; canEdit: boolean; saving: boolean; error: string }
const published = import.meta.env.PROD
const recoveryKey = 'english-race:where-lesson:recovery:v1'
export function connectRaceLesson(doc: Y.Doc, status: (state: LessonSyncState) => void) {
  let stopped = false, running = false, ready = false, canEdit = false, dirty = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const report = (error = '') => { if (!stopped) status({ ready, canEdit, saving: dirty, error }) }
  const schedule = (delay: number) => { clearTimeout(timer); if (!stopped) timer = setTimeout(() => void sync(), delay) }
  const recovery = () => { try { localStorage.setItem(recoveryKey, encodeDocument(doc)) } catch { /* Server persistence is authoritative. */ } }
  async function sync() {
    if (stopped || running) return
    running = true
    try {
      const uploading = ready && canEdit && dirty
      const sent = uploading ? encodeDocument(doc) : undefined
      const response = await fetch(published ? '/lessons/where-is-the.json' : '/api/race-lesson-document', {
        method: uploading ? 'POST' : 'GET', cache: 'no-store', signal: AbortSignal.timeout(8000),
        ...(uploading ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ snapshot: sent }) } : {}),
      })
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('เปิดบทเรียนไม่ได้ กรุณาลองอีกครั้ง')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'บันทึกไม่ได้ กรุณาลองอีกครั้ง')
      if (stopped) return
      // Compare before merging a response: edits made during the request still need saving.
      const changedWhileSaving = uploading && encodeDocument(doc) !== sent
      mergeDocument(doc, data.snapshot)
      canEdit = !published && data.canEdit === true
      if (!ready && canEdit) {
        const cached = localStorage.getItem(recoveryKey)
        if (cached) { try { mergeDocument(doc, cached); dirty = true } catch { localStorage.removeItem(recoveryKey) } }
      }
      if (uploading) dirty = changedWhileSaving
      ready = true
      if (!dirty) localStorage.removeItem(recoveryKey)
      report()
    } catch (error) { report(error instanceof Error ? error.message : 'โหลดบทเรียนไม่ได้ ลองอีกครั้ง') }
    finally { running = false; if (!published || !ready) schedule(dirty ? 700 : 2500) }
  }
  const changed = (_update: Uint8Array, origin: unknown) => {
    if (origin === remoteOrigin || !ready || !canEdit) return
    dirty = true; recovery(); report(); if (!running) schedule(300)
  }
  const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
  doc.on('update', changed); window.addEventListener('beforeunload', beforeUnload); void sync()
  return () => { stopped = true; clearTimeout(timer); doc.off('update', changed); window.removeEventListener('beforeunload', beforeUnload) }
}

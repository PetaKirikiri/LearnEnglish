import * as Y from 'yjs'
import { supabase } from '../lib/supabase'

export const remoteOrigin = 'lesson-document-remote'
export const encodeDocument = (doc:Y.Doc) => btoa(Array.from(Y.encodeStateAsUpdate(doc), byte=>String.fromCharCode(byte)).join(''))
export function mergeDocument(doc:Y.Doc,snapshot:string) {
  if(snapshot.length>2000000)throw new Error('Document is too large')
  Y.applyUpdate(doc,Uint8Array.from(atob(snapshot),char=>char.charCodeAt(0)),remoteOrigin)
}
export function documentKey(lessonId:string,userId:string,preview:boolean) {
  return `englishsuccess:document:v1:${preview?'preview':'shared'}:${userId}:${lessonId}`
}
export type DocumentStatus='Loading…'|'Saved'|'Saved on this device'|'Saving…'|'Offline — changes kept on this device'|'Could not save on this device'

// Same Tiptap/Yjs foundation as Ka Piki; account-scoped local recovery plus a
// compare-and-swap snapshot prevents two teacher tabs overwriting each other.
export function connectDocument(doc:Y.Doc, options:{lessonId:string;userId:string;preview:boolean;teacher:boolean;status:(status:DocumentStatus)=>void}) {
  const key=documentKey(options.lessonId,options.userId,options.preview)
  let stopped=false,dirty=false,running=false,timer:ReturnType<typeof setTimeout>|undefined
  const saveLocal=()=>{try{localStorage.setItem(key,encodeDocument(doc));return true}catch{options.status('Could not save on this device');return false}}
  const schedule=(delay=2000)=>{clearTimeout(timer);if(!stopped)timer=setTimeout(()=>void sync(),delay)}
  const sync=async()=>{
    if(stopped||running||options.preview)return
    running=true
    try {
      const {data:row,error}=await supabase.from('englishsuccess_lesson_documents').select('snapshot,revision').eq('lesson_id',options.lessonId).abortSignal(AbortSignal.timeout(10000)).maybeSingle()
      if(error)throw error
      if(stopped)return
      if(row)mergeDocument(doc,row.snapshot)
      if(options.teacher&&dirty){
        const snapshot=encodeDocument(doc)
        if(snapshot.length>2000000)throw new Error('Document is too large')
        dirty=false
        const payload={lesson_id:options.lessonId,snapshot,revision:(row?.revision??0)+1}
        let result
        try { result=row
          ? await supabase.from('englishsuccess_lesson_documents').update(payload).eq('lesson_id',options.lessonId).eq('revision',row.revision).select('revision').abortSignal(AbortSignal.timeout(10000))
          : await supabase.from('englishsuccess_lesson_documents').insert(payload).select('revision').abortSignal(AbortSignal.timeout(10000))
        } catch(error) {dirty=true;throw error}
        if(result.error||!result.data?.length){dirty=true;throw result.error??new Error('Document changed; retrying')}
      }
      if(!stopped&&saveLocal()) options.status(dirty?'Saving…':'Saved')
    } catch {if(!stopped)options.status('Offline — changes kept on this device')}
    finally {running=false;schedule(dirty?800:2000)}
  }
  try {const cached=localStorage.getItem(key);if(cached){mergeDocument(doc,cached);dirty=options.teacher}}catch{options.status('Could not save on this device')}
  const update=(_update:Uint8Array,origin:unknown)=>{
    if(origin===remoteOrigin)return
    if(!options.teacher)return
    dirty=true
    if(saveLocal())options.status(options.preview?'Saved on this device':'Saving…')
    if(!running)schedule(350)
  }
  doc.on('update',update)
  if(options.preview)options.status('Saved on this device');else void sync()
  const beforeUnload=(event:BeforeUnloadEvent)=>{if(dirty&&!options.preview){event.preventDefault();event.returnValue=''}}
  window.addEventListener('beforeunload',beforeUnload)
  return ()=>{stopped=true;clearTimeout(timer);doc.off('update',update);window.removeEventListener('beforeunload',beforeUnload)}
}

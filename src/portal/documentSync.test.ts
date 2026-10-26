// @vitest-environment happy-dom
import {afterEach,expect,it,vi} from 'vitest'
import * as Y from 'yjs'
import {connectDocument,documentKey,encodeDocument,mergeDocument} from './documentSync'
vi.mock('../lib/supabase',()=>({supabase:{from:vi.fn(()=>{throw new Error('Preview must not access database')})}}))
afterEach(()=>localStorage.clear())
it('merges concurrent document edits without replacing either writer',()=>{
  const first=new Y.Doc(),second=new Y.Doc()
  first.getText('test').insert(0,'Hello')
  mergeDocument(second,encodeDocument(first))
  first.getText('test').insert(5,' class')
  second.getText('test').insert(5,' today')
  mergeDocument(first,encodeDocument(second));mergeDocument(second,encodeDocument(first))
  expect(first.getText('test').toString()).toBe(second.getText('test').toString())
  expect(first.getText('test').toString()).toContain('class')
  expect(first.getText('test').toString()).toContain('today')
})
it('saves and restores local document pages scoped to the learner and lesson',()=>{
  const status=vi.fn(),doc=new Y.Doc()
  const close=connectDocument(doc,{lessonId:'one',userId:'teacher',preview:true,teacher:true,status})
  doc.getMap('pages').set('page-2',{id:'page-2',title:'Second page',order:1})
  close()
  expect(localStorage.getItem(documentKey('one','other',true))).toBeNull()
  const restored=new Y.Doc()
  const stop=connectDocument(restored,{lessonId:'one',userId:'teacher',preview:true,teacher:true,status})
  expect(restored.getMap('pages').get('page-2')).toEqual({id:'page-2',title:'Second page',order:1})
  expect(status).toHaveBeenCalledWith('Saved on this device')
  stop()
})

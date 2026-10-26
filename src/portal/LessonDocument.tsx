import { useEffect, useState } from 'react'
import { EditorContent, useEditor, useEditorState, type Extensions } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import { TableKit } from '@tiptap/extension-table'
import { TextStyleKit } from '@tiptap/extension-text-style'
import * as Y from 'yjs'
import WhiteboardTextTools from './WhiteboardTextTools'
import WhiteboardTableTools from './WhiteboardTableTools'
import { connectDocument, type DocumentStatus } from './documentSync'
import './document.css'

type Page={id:string;title:string;order:number}
const defaultPage:Page={id:'default',title:'Lesson',order:0}
function pagesOf(doc:Y.Doc) {
  return [defaultPage,...[...doc.getMap<Page>('pages').values()].filter(p=>p&&typeof p.id==='string'&&p.id!=='default'&&typeof p.title==='string'&&Number.isFinite(p.order))].map(p=>doc.getMap<Page>('pages').get(p.id)??p).sort((a,b)=>a.order-b.order)
}
export default function LessonDocument({lessonId,userId,teacher,preview}:{lessonId:string;userId:string;teacher:boolean;preview:boolean}) {
  const [doc]=useState(()=>new Y.Doc())
  const [pages,setPages]=useState<Page[]>([defaultPage]),[selected,setSelected]=useState('default')
  const [status,setStatus]=useState<DocumentStatus>('Loading…')
  const [editing,setEditing]=useState(false)
  useEffect(()=>{
    const refresh=()=>setPages(pagesOf(doc))
    doc.getMap('pages').observe(refresh)
    const close=connectDocument(doc,{lessonId,userId,teacher,preview,status:setStatus})
    refresh()
    return ()=>{close();doc.getMap('pages').unobserve(refresh)}
  },[doc,lessonId,userId,teacher,preview])
  const page=pages.find(p=>p.id===selected)??pages[0]
  return <section className="lesson-document" aria-label="Lesson document">
    <div className="document-top">{pages.length>1&&<div role="tablist" aria-label="Document pages">{pages.map(p=><button key={p.id} role="tab" aria-selected={p.id===page.id} onClick={()=>setSelected(p.id)}>{p.title}</button>)}</div>}
      {teacher&&<button className="document-edit" aria-pressed={editing} onClick={()=>setEditing(value=>!value)}>{editing?'Done':'Edit notes'}</button>}</div>
    {status.includes('Offline')||status.includes('Could not')?<p role="alert">{status}</p>:null}
    <DocumentEditor key={page.id} doc={doc} page={page} editable={teacher&&editing}/>
  </section>
}
const noExtensions: Extensions = []
export function DocumentEditor({doc,page,editable,extensions=noExtensions}:{doc:Y.Doc;page:Page;editable:boolean;extensions?:Extensions}) {
  // Ported from Ka Piki WhiteboardEditor: same document fields, rich text,
  // table and formatting tools, without Maori-specific POS/rail extensions.
  const editor=useEditor({editable,extensions:[StarterKit.configure({undoRedo:false,link:false,codeBlock:false,code:false,horizontalRule:false}),TextStyleKit.configure({fontSize:false,lineHeight:false}),TableKit,...extensions,Collaboration.configure({document:doc,field:page.id})],editorProps:{attributes:{class:'english-document-paper',role:'textbox','aria-label':`${page.title} document`,'aria-multiline':'true'}}},[doc,page.id])
  useEffect(()=>{editor?.setEditable(editable)},[editor,editable])
  const state=useEditorState({editor,selector:({editor})=>({bold:editor?.isActive('bold'),italic:editor?.isActive('italic'),underline:editor?.isActive('underline'),table:editor?.isActive('table'),font:editor?.getAttributes('textStyle').fontFamily,colour:editor?.getAttributes('textStyle').color,background:editor?.getAttributes('textStyle').backgroundColor})})
  return <>{editable&&<div className="whiteboard-toolbar" role="toolbar" aria-label="Document formatting">
    <WhiteboardTextTools editor={editor} disabled={!editor} font={state?.font} colour={state?.colour} background={state?.background}/>
    <button aria-label="Bold" aria-pressed={state?.bold} onMouseDown={e=>e.preventDefault()} onClick={()=>editor?.chain().focus().toggleBold().run()}><b>B</b></button>
    <button aria-label="Italic" aria-pressed={state?.italic} onMouseDown={e=>e.preventDefault()} onClick={()=>editor?.chain().focus().toggleItalic().run()}><i>I</i></button>
    <button aria-label="Underline" aria-pressed={state?.underline} onMouseDown={e=>e.preventDefault()} onClick={()=>editor?.chain().focus().toggleUnderline().run()}><u>U</u></button>
    <button aria-label="Heading" onMouseDown={e=>e.preventDefault()} onClick={()=>editor?.chain().focus().toggleHeading({level:2}).run()}>H</button>
    <button aria-label="Bullet list" onMouseDown={e=>e.preventDefault()} onClick={()=>editor?.chain().focus().toggleBulletList().run()}>• List</button>
    <WhiteboardTableTools editor={editor} inTable={!!state?.table} disabled={!editor}/>
    <button aria-label="Undo" onMouseDown={e=>e.preventDefault()} onClick={()=>editor?.chain().focus().undo().run()}>↶</button><button aria-label="Redo" onMouseDown={e=>e.preventDefault()} onClick={()=>editor?.chain().focus().redo().run()}>↷</button>
  </div>}<div className="english-document-scroll"><EditorContent editor={editor}/></div></>
}

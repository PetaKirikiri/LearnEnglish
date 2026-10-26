// Reused from Ka Piki's custom lesson editor (connectors).
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/react'

const colours = [
  ['Ink', '#294a63'], ['Black', '#222222'], ['Grey', '#666666'], ['White', '#ffffff'],
  ['Red', '#b83232'], ['Orange', '#c46b12'], ['Green', '#28734b'], ['Blue', '#285cb4'],
  ['Purple', '#7b44a4'], ['Pink', '#f4c4d7'], ['Yellow', '#fff2a8'], ['Mint', '#c6e6d4'],
] as const

function ColourPicker({ editor, highlight, value, disabled }: { editor: Editor | null; highlight?: boolean; value?: string; disabled: boolean }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const trigger = useRef<HTMLButtonElement>(null), menu = useRef<HTMLDivElement>(null)
  const id = useId(), label = highlight ? 'Text background colour' : 'Text colour'
  const visible = open && !disabled
  useEffect(() => {
    if (!visible) return
    menu.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    const close = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setOpen(false)
    }
    const resize = () => setOpen(false)
    document.addEventListener('pointerdown', close); window.addEventListener('resize', resize)
    return () => { document.removeEventListener('pointerdown', close); window.removeEventListener('resize', resize) }
  }, [visible])
  function apply(colour: string | null) {
    if (!editor) return
    const chain = editor.chain().focus()
    if (highlight) { if (colour) chain.setBackgroundColor(colour); else chain.unsetBackgroundColor() }
    else { if (colour) chain.setColor(colour); else chain.unsetColor() }
    chain.run(); setOpen(false)
  }
  return <>
    <button ref={trigger} type="button" className="whiteboard-colour-trigger" aria-label={label} title={label} aria-haspopup="dialog" aria-expanded={visible} aria-controls={visible ? id : undefined} disabled={disabled || !editor}
      onMouseDown={event => event.preventDefault()} onClick={() => {
        const rect = trigger.current!.getBoundingClientRect()
        setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 216)), top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 192)) })
        setOpen(current => !current)
      }}><span style={highlight ? { backgroundColor: value || '#fff2a8' } : { borderBottom: `4px solid ${value || '#294a63'}` }}>A</span></button>
    {visible && createPortal(<div ref={menu} id={id} className="whiteboard-colour-menu" role="dialog" aria-label={label} style={position}
      onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() } }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node) && event.relatedTarget !== trigger.current) setOpen(false) }}>
      <div className="whiteboard-colour-grid">{colours.map(([name, colour]) => <button key={name} type="button" aria-label={name} title={name} aria-pressed={value?.toLowerCase() === colour} style={{ backgroundColor: colour }} onMouseDown={event => event.preventDefault()} onClick={() => apply(colour)} />)}</div>
      <button type="button" className="whiteboard-colour-reset" onMouseDown={event => event.preventDefault()} onClick={() => apply(null)}>{highlight ? 'No highlight' : 'Default colour'}</button>
    </div>, document.body)}
  </>
}

export default function WhiteboardTextTools({ editor, disabled, font, colour, background }: { editor: Editor | null; disabled: boolean; font?: string; colour?: string; background?: string }) {
  return <>
    <select className="whiteboard-font" aria-label="Font" title="Font" value={font || ''} disabled={disabled || !editor} onChange={event => {
      const chain = editor?.chain().focus()
      if (event.target.value) chain?.setFontFamily(event.target.value).run(); else chain?.unsetFontFamily().run()
    }}>
      <option value="">Default font</option>
      {['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New'].map(name => <option key={name} value={name}>{name}</option>)}
    </select>
    <ColourPicker editor={editor} disabled={disabled} value={colour} />
    <ColourPicker editor={editor} disabled={disabled} value={background} highlight />
  </>
}

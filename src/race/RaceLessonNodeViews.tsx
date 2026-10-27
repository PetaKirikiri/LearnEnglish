import PluralWordExplorer from './PluralWordExplorer'
import { NodeViewWrapper, useEditorState, type NodeViewProps } from '@tiptap/react'
import { useState } from 'react'
import ExampleLanguage, { type ExampleUnit } from '../learning/ExampleLanguage'
import { HolidayWordExplorer } from './RaceLessonExamples'

export function ExampleView({ node, editor, updateAttributes }: NodeViewProps) {
  const [editing, setEditing] = useState(false)
  const editable = useEditorState({ editor, selector: ({ editor }) => editor.isEditable })
  const units = node.attrs.units as ExampleUnit[]
  return <NodeViewWrapper className="rl-document-example" contentEditable={false}>
    <ExampleLanguage matrix english={node.attrs.english} thai={node.attrs.thai} units={units}/>
    {editable && <button className="rl-edit-example" onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit example'}</button>}
    {editing && editable && <div className="rl-example-fields">
      {units.map((unit, index) => <div key={index}>
        <input aria-label={`English part ${index + 1}`} value={unit.english} onChange={event => { const next = units.map((item, i) => i === index ? { ...item, english: event.target.value } : item); updateAttributes({ units: next, english: next.map(item => item.english).join(' ') }) }}/>
        <input aria-label={`Thai meaning ${index + 1}`} value={unit.thai} onChange={event => updateAttributes({ units: units.map((item, i) => i === index ? { ...item, thai: event.target.value } : item) })}/>
      </div>)}
      <label>Thai sentence<input value={node.attrs.thai} onChange={event => updateAttributes({ thai: event.target.value })}/></label>
    </div>}
  </NodeViewWrapper>
}
export function HolidayWordsView() { return <NodeViewWrapper><HolidayWordExplorer/></NodeViewWrapper> }

export function PluralWordsView() { return <NodeViewWrapper><PluralWordExplorer/></NodeViewWrapper> }

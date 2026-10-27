import { useId } from 'react'
import SentenceSlot from './SentenceSlot'
import { useSentenceSlots, type SlotDefinition, type SlotGroup } from './sentenceSlotEngine'
import './sentenceSlotBuilder.css'

export default function SentenceSlotBuilder({ slots, group, label, translation, values, assessment = false }: {
  values?: readonly string[]; assessment?: boolean;
  slots: readonly SlotDefinition[]; group?: SlotGroup; label: string;
  translation?: (parts: readonly (readonly [string, string])[], selected: number[]) => string
}) {
  const { active, selected, parts: selectedParts, choose, toggle } = useSentenceSlots(slots)
  const parts = values ? slots.map((slot, i) => slot.options.find(option => option[0] === values[i]) ?? selectedParts[i]) : selectedParts
  const choicesId = useId()
  function card(i: number) {
    const slot = slots[i]
    return <button key={i} className={`tonight-slot slot-${i}`} disabled={assessment} aria-expanded={assessment ? undefined : active === i} aria-controls={choicesId} aria-label={`Slot ${i + 1}: ${parts[i][0]}, ${slot.options.length} choices`} onClick={() => toggle(i)}>
      <SentenceSlot slot={i}><strong>{parts[i][0]}</strong>{!assessment && <span lang="th">{parts[i][1]}</span>}<small className="slot-count" aria-label={`${slot.options.length} words in slot ${i + 1}`}><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="6" y="3" width="10" height="12" rx="2"/><path d="M3 6v10a2 2 0 0 0 2 2h8"/></svg>{slot.options.length}</small></SentenceSlot>
    </button>
  }
  return <section className="tonight-tree" aria-label={label} lang="en">
    <div className="tonight-slots" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
      {slots.map((_, i) => {
        if (group && i >= group.start && i <= group.end) return i === group.start ? <div key="group" className="sentence-slot-group" role="group" aria-label={group.label} style={{ gridColumn: `span ${group.end - group.start + 1}` }}>
          <span className="sentence-group-label"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/></svg>{group.label}</span>
          <div className="sentence-group-cards" style={{ gridTemplateColumns: `repeat(${group.end - group.start + 1}, minmax(0, 1fr))` }}>{slots.slice(group.start, group.end + 1).map((_, offset) => card(group.start + offset))}</div>
        </div> : null
        return card(i)
      })}
    </div>
    {!assessment && active !== null && <div id={choicesId} className="tonight-choices" role="group" aria-label={`Slot ${active + 1} choices`}>{slots[active].options.map(([word, thai], index) => <button key={word} aria-pressed={selected[active] === index} onClick={() => choose(active, index)}><strong>{word}</strong><span lang="th">{thai}</span></button>)}</div>}
    {!assessment && translation && <div className="tonight-sentence" aria-live="polite"><span lang="th">{translation(parts, selected)}</span></div>}
  </section>
}

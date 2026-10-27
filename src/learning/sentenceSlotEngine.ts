import { useState } from 'react'
export type SlotDefinition = { label: string; options: readonly (readonly [string, string])[] }
export type SlotGroup = { label: string; start: number; end: number }
export function useSentenceSlots(slots: readonly SlotDefinition[]) {
  const [active, setActive] = useState<number | null>(null)
  const [selected, setSelected] = useState<number[]>(() => slots.map(() => 0))
  const parts = slots.map((slot, i) => slot.options[selected[i]] ?? slot.options[0])
  function choose(slot: number, option: number) {
    if (!slots[slot]?.options[option]) return
    setSelected(previous => slots.map((_, i) => i === slot ? option : previous[i] ?? 0))
  }
  return { active, selected, parts, choose, toggle: (index: number) => setActive(previous => previous === index ? null : index) }
}

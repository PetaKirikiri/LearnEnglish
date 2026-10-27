import { useState } from 'react'
export type SlotDefinition = { label: string; options: readonly (readonly [string, string])[] }
export type SlotGroup = { label: string; start: number; end: number }
export function useSentenceSlots(slots: readonly SlotDefinition[], initialWords:readonly (string|undefined)[] = []) {
  const [active, setActive] = useState<number | null>(null)
  const [chosen, setChosen] = useState<readonly (string | undefined)[]>(initialWords)
  const selected = slots.map((slot,i)=>Math.max(0,slot.options.findIndex(option=>option[0]===chosen[i])))
  const parts = slots.map((slot, i) => slot.options[selected[i]])
  function choose(slot: number, option: number) {
    if (!slots[slot]?.options[option]) return
    setChosen(previous => slots.map((_, i) => i === slot ? slots[slot].options[option][0] : previous[i]))
  }
  return { active, setActive, selected, parts, choose, toggle: (index: number) => setActive(previous => previous === index ? null : index) }
}

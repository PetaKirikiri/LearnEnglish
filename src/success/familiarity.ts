import type { WordFamiliarity } from '../hotel/wordFamiliarity'
import { normalizeHelpWord } from '../learning/helpPoints'

// Keep question phrases intact wherever they appear, not only in isolation.
export const successTokenPattern = /(how\s+(?:much|many)\b|[\p{L}]+(?:[’'][\p{L}]+)*)/giu
export function successWordUnits(text:string) {
  return text.match(successTokenPattern) ?? []
}
export function successWordOpacity(memory:WordFamiliarity,unit:string) {
  return 1-(memory[normalizeHelpWord(unit)]?.strength ?? 0)/8
}
export function recordSuccessExposure(memory:WordFamiliarity,text:string,correct:boolean,assisted:boolean) {
  const result={...memory}
  for(const unit of new Set(successWordUnits(text).map(normalizeHelpWord))) {
    const prior=memory[unit]??{seen:0,strength:0}
    result[unit]={seen:prior.seen+1,strength:correct
      ? Math.min(8,prior.strength+Number(!assisted))
      : Math.max(0,prior.strength-1)}
  }
  return result
}

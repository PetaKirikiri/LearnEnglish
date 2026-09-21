import type { VerbForms } from './types'
// This is a conservative auxiliary-pattern check, not a general-purpose parser.
export function tenseInContext(word:string,context:string,verb:VerbForms):string|null {
  const words=(context.toLowerCase().match(/[a-z]+(?:['’][a-z]+)*|_{2,}|[.!?;]/g)??[]).map(w=>w.replaceAll('’',"'"))
  const indices=words.flatMap((w,i)=>w===word?[i]:[])
  if(indices.length!==1)return null
  const index=indices[0],before=words.slice(Math.max(0,index-5),index).filter(w=>!['usually','often','always','already','just','traditionally','never'].includes(w)).join(' ')
  const isPast=verb.past.split(' / ').includes(word),isParticiple=verb.participle.split(' / ').includes(word)
  if(word===verb.ing){if(/(?:has|have|'ve|'s) been$/.test(before))return 'ปัจจุบันสมบูรณ์ต่อเนื่อง';if(/had been$/.test(before))return 'อดีตสมบูรณ์ต่อเนื่อง';if(/\b(?:was|were)(?: not)?$/.test(before))return 'อดีตกำลังดำเนินอยู่';if(/\b(?:am|is|are)(?: not)?$/.test(before))return 'ปัจจุบันกำลังดำเนินอยู่';return null}
  if(isParticiple){if(/\bwill have$/.test(before))return 'อนาคตสมบูรณ์';if(/\bhad(?: not)?$/.test(before))return 'อดีตสมบูรณ์';if(/\b(?:has|have)(?: not)?$/.test(before))return 'ปัจจุบันสมบูรณ์';if(/\b(?:is|are|am)(?: not)?$/.test(before))return 'ปัจจุบัน · รูปถูกกระทำ';if(/\b(?:was|were)(?: not)?$/.test(before))return 'อดีต · รูปถูกกระทำ';if(/\b(?:be|been)(?: not)?$/.test(before))return 'รูปถูกกระทำ — ดูกริยาช่วยเพื่อบอกเวลา'}
  if(word===verb.base && /\bwill(?: not)?$/.test(before))return 'อนาคต ใช้ will + กริยารูปพื้นฐาน'
  if(word===verb.base && /\b(?:did|didn't)(?: not)?$/.test(before))return 'อดีต ใช้ did + กริยารูปพื้นฐาน'
  // Bare words and noun/verb homographs cannot establish a sentence tense reliably.
  if(isPast && !isParticiple && word!==verb.base)return 'อดีต'
  return null
}

// Keep source pair IDs stable for Padel/Pilates interleaving, but give changed
// questions fresh learning IDs and audio URLs. Never reuse old mastery/audio.
export const revisedPadelPairs = new Set([
  'gear-4', 'bookings-1', 'teamwork-4', 'pilates-gear-2',
  'pilates-facilities-2', 'pilates-facilities-4', 'pilates-possession-4',
  'pilates-service-1', 'pilates-desk-2',
])
export const padelQuestionId = (pair: string, index: number) =>
  `padel-${pair}${revisedPadelPairs.has(pair) ? '-v2' : ''}-${index + 1}`

export type Segment = { text: string; skill: string }
export type HotelQuestion = { id: string; english: string; skill: string; answers: [Segment[], Segment[]]; correct: 0 | 1; audioUrl: string }
export const skills = ['people', 'things', 'person', 'action', 'place', 'ongoing', 'finished', 'intention']
export const skillNames = ['People', 'Things', 'Who', 'Actions', 'Places', 'Happening now', 'Already done', 'Plans']
const questions: HotelQuestion[] = []
function pair(skill: string, english: [string, string], thai: [string, string], prefix = '', prefixSkill = skill) {
  english.forEach((text, correct) => {
    const id = `hotel-${questions.length + 1}`
    questions.push({ id, english: text, skill, correct: correct as 0 | 1,
      answers: thai.map(value => [...(prefix ? [{ text: prefix, skill: prefixSkill }] : []), { text: value, skill }]) as HotelQuestion['answers'],
      audioUrl: `/audio/hotel/${id}.wav` })
  })
}
pair('people', ['The woman.', 'The man.'], ['ผู้หญิง', 'ผู้ชาย'])
pair('people', ['The woman is here.', 'The man is here.'], ['ผู้หญิงอยู่ที่นี่', 'ผู้ชายอยู่ที่นี่'])
pair('things', ['A towel.', 'A key.'], ['ผ้าขนหนู', 'กุญแจ'])
pair('things', ['I need a towel.', 'I need a key.'], ['ฉันต้องการผ้าขนหนู', 'ฉันต้องการกุญแจ'])
pair('person', ['She is eating.', 'He is eating.'], ['ผู้หญิงคนนั้นกำลังกิน', 'ผู้ชายคนนั้นกำลังกิน'])
pair('person', ['She is sleeping.', 'He is sleeping.'], ['ผู้หญิงคนนั้นกำลังนอนหลับ', 'ผู้ชายคนนั้นกำลังนอนหลับ'])
pair('action', ['The woman is eating.', 'The woman is sleeping.'], ['กำลังกิน', 'กำลังนอนหลับ'], 'ผู้หญิง', 'people')
pair('action', ['The man is eating.', 'The man is sleeping.'], ['กำลังกิน', 'กำลังนอนหลับ'], 'ผู้ชาย', 'people')
pair('place', ['In the room.', 'In the kitchen.'], ['ในห้อง', 'ในครัว'])
pair('place', ['She is in the room.', 'She is in the kitchen.'], ['อยู่ในห้อง', 'อยู่ในครัว'], 'ผู้หญิงคนนั้น', 'person')
pair('ongoing', ['I am eating now.', 'I eat every day.'], ['ฉันกำลังกินอยู่ตอนนี้', 'ฉันกินทุกวัน'])
pair('ongoing', ['I am working now.', 'I work every day.'], ['ฉันกำลังทำงานอยู่ตอนนี้', 'ฉันทำงานทุกวัน'])
pair('finished', ['I have already eaten.', 'I am eating now.'], ['ฉันกินแล้ว', 'ฉันกำลังกินอยู่ตอนนี้'])
pair('finished', ['I have already cleaned the room.', 'I am cleaning the room now.'], ['ฉันทำความสะอาดห้องแล้ว', 'ฉันกำลังทำความสะอาดห้องอยู่ตอนนี้'])
pair('intention', ['I am going to eat.', 'I am eating now.'], ['ฉันจะกิน', 'ฉันกำลังกินอยู่ตอนนี้'])
pair('intention', ['I am going to clean the room.', 'I am cleaning the room now.'], ['ฉันจะทำความสะอาดห้อง', 'ฉันกำลังทำความสะอาดห้องอยู่ตอนนี้'])
export const hotelQuestions: readonly HotelQuestion[] = questions
export type Progress = Record<string, { seen: string[]; correct: number; attempts: number }>
export function recordAnswer(progress: Progress, question: HotelQuestion, correct: boolean, assisted: boolean): Progress {
  const prior = progress[question.skill] ?? { seen: [], correct: 0, attempts: 0 }
  return { ...progress, [question.skill]: { attempts: prior.attempts + 1,
    correct: prior.correct + Number(correct),
    seen: !correct ? prior.seen.slice(0, -2) : assisted ? prior.seen : [...new Set([...prior.seen, question.id])],
  } }
}
export function supportOpacity(progress: Progress, skill: string) {
  return Math.max(0.45, 1 - (progress[skill]?.seen.length ?? 0) * 0.13)
}
export function nextQuestion(progress: Progress, previous?: string, round = 0, random = Math.random) {
  const unfinished = skills.filter(skill => (progress[skill]?.seen.length ?? 0) < 4)
  const focus = unfinished.slice(0, 2)
  const review = skills.filter(skill => !unfinished.includes(skill))
  const pool = round % 4 === 3 && review.length ? review : focus.length ? focus : skills
  const selectedSkill = pool[round % pool.length]
  const candidates = questions.filter(q => q.skill === selectedSkill && q.id !== previous)
  const unseen = candidates.filter(q => !progress[q.skill]?.seen.includes(q.id))
  // Introduce the short chunk pair before its longer sentence contexts.
  const available = unseen.length ? unseen.slice(0, 2) : candidates
  return available[Math.min(available.length - 1, Math.floor(random() * available.length))]
}
export function loadProgress(userId: string): Progress {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(`hotel:v1:${userId}`) ?? '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const result: Progress = {}
    for (const skill of skills) {
      const value = (parsed as Progress)[skill]
      if (value && Array.isArray(value.seen) && value.seen.every(id => typeof id === 'string') && Number.isFinite(value.correct) && Number.isFinite(value.attempts)) result[skill] = value
    }
    return result
  } catch { return {} }
}

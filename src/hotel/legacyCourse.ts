// Preserved vocabulary/reference catalogue and v1 progress contract for Padel.
import { expandedHotelPairs } from './expandedContent'
import { hotelRoutinePairs } from './routineContent'

export type Segment = { text: string; skill: string }
export type HotelQuestion = { id: string; english: string; skill: string; answers: [Segment[], Segment[]]; correct: 0 | 1; audioUrl: string }
export const skills = ['people', 'things', 'person', 'action', 'place', 'quantity', 'possession', 'negative', 'ongoing', 'finished', 'intention', 'requests', 'conversation', 'help', 'facilities', 'hours', 'stay_times', 'wake_up', 'arrivals', 'rules']
export const skillNames = ['People', 'Things', 'Who', 'Actions', 'Places', 'One or more', 'Whose', 'Not', 'Happening now', 'Already done', 'Plans', 'Requests', 'Guest conversation', 'Offering help', 'Facilities', 'Opening hours', 'Check-in & checkout', 'Wake-up calls', 'Arrivals & departures', 'Hotel rules']
// Revised meanings get fresh IDs/audio paths; unchanged items retain mastery.
const revisedItems = new Set([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 127, 128, 131, 132, 135, 136, 139, 140, 143, 144, 147, 148, 153, 154, 155, 156, 157, 158, 159, 160, 165, 166, 167, 168, 169, 170, 171, 172, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188])
const questions: HotelQuestion[] = []
function pair(skill: string, english: readonly [string, string], thai: readonly [string, string], prefix = '', prefixSkill = skill) {
  english.forEach((text, correct) => {
    const number = questions.length + 1
    const id = `hotel-${number}${revisedItems.has(number) ? '-r2' : ''}`
    questions.push({ id, english: text, skill, correct: correct as 0 | 1,
      answers: thai.map(value => [...(prefix ? [{ text: prefix, skill: prefixSkill }] : []), { text: value, skill }]) as HotelQuestion['answers'],
      audioUrl: `/audio/hotel/${id}.wav` })
  })
}
pair('people', ['The woman.', 'The man.'], ['ผู้หญิง', 'ผู้ชาย'])
pair('people', ['The woman is here.', 'The man is here.'], ['ผู้หญิงอยู่ที่นี่', 'ผู้ชายอยู่ที่นี่'])
pair('things', ['A towel.', 'A key.'], ['ผ้าขนหนู', 'กุญแจ'])
pair('things', ['Do you need a towel?', 'Do you need a key?'], ['คุณต้องการผ้าขนหนูไหม', 'คุณต้องการกุญแจไหม'])
pair('person', ['She is checking in.', 'He is checking in.'], ['ผู้หญิงคนนั้นกำลังเช็กอิน', 'ผู้ชายคนนั้นกำลังเช็กอิน'])
pair('person', ['She has a reservation.', 'He has a reservation.'], ['ผู้หญิงคนนั้นจองไว้แล้ว', 'ผู้ชายคนนั้นจองไว้แล้ว'])
pair('action', ['Are you checking in?', 'Are you checking out?'], ['คุณจะเช็กอินใช่ไหม', 'คุณจะเช็กเอาต์ใช่ไหม'])
pair('action', ['Would you like to book a room?', 'Would you like to change your booking?'], ['คุณต้องการจองห้องพักไหม', 'คุณต้องการเปลี่ยนแปลงการจองไหม'])
pair('place', ['In the lobby.', 'In the restaurant.'], ['ในล็อบบี้', 'ในห้องอาหาร'])
pair('place', ['You can wait in the lobby.', 'You can wait in the restaurant.'], ['คุณรอในล็อบบี้ได้', 'คุณรอในห้องอาหารได้'])
pair('ongoing', ['We are serving breakfast now.', 'We serve breakfast until ten.'], ['ตอนนี้เรากำลังให้บริการอาหารเช้า', 'เราให้บริการอาหารเช้าถึงสิบโมง'])
pair('ongoing', ['The shuttle is leaving now.', 'The shuttle leaves every hour.'], ['รถรับส่งกำลังออกตอนนี้', 'รถรับส่งออกทุกชั่วโมง'])
pair('finished', ['Your taxi has arrived.', 'Your taxi has not arrived yet.'], ['แท็กซี่ของคุณมาถึงแล้ว', 'แท็กซี่ของคุณยังมาไม่ถึง'])
pair('finished', ['Housekeeping has finished your room.', 'Housekeeping is still preparing your room.'], ['แม่บ้านจัดเตรียมห้องของคุณเสร็จแล้ว', 'แม่บ้านยังเตรียมห้องของคุณอยู่'])
pair('intention', ['I will check that for you.', 'I am checking that for you now.'], ['ฉันจะตรวจสอบเรื่องนั้นให้คุณ', 'ตอนนี้ฉันกำลังตรวจสอบเรื่องนั้นให้คุณ'])
pair('intention', ['I will ask housekeeping.', 'I am asking housekeeping now.'], ['ฉันจะสอบถามแม่บ้านให้', 'ตอนนี้ฉันกำลังสอบถามแม่บ้านให้'])
for (const [skill, english, thai] of expandedHotelPairs) pair(skill, english, thai)
for (const [skill, english, thai] of hotelRoutinePairs) pair(skill, english, thai)
// IDs stay fixed; curriculum order is shared by practice and the content table.
export const hotelQuestions: readonly HotelQuestion[] = [...questions].sort((a, b) => skills.indexOf(a.skill) - skills.indexOf(b.skill))
export type Progress = Record<string, { seen: string[]; correct: number; attempts: number }>
export function isSkillComplete(progress: Progress, skill: string) {
  const items = hotelQuestions.filter(q => q.skill === skill)
  return items.length > 0 && items.every(q => progress[skill]?.seen.includes(q.id))
}
export function recordAnswer(progress: Progress, question: HotelQuestion, correct: boolean, assisted: boolean): Progress {
  const prior = progress[question.skill] ?? { seen: [], correct: 0, attempts: 0 }
  return { ...progress, [question.skill]: { attempts: prior.attempts + 1,
    correct: prior.correct + Number(correct),
    seen: !correct ? prior.seen.slice(0, -2) : assisted ? prior.seen : [...new Set([...prior.seen, question.id])],
  } }
}
export function supportOpacity(progress: Progress, skill: string) {
  const total = hotelQuestions.filter(q => q.skill === skill).length
  return Math.max(0.45, 1 - (progress[skill]?.seen.length ?? 0) / Math.max(1, total) * 0.55)
}
export function nextQuestion(progress: Progress, previous?: string, round = 0, random = Math.random) {
  const unfinished = skills.filter(skill => !isSkillComplete(progress, skill))
  const focus = unfinished.slice(0, 2)
  const review = skills.filter(skill => !unfinished.includes(skill))
  const reviewing = round % 4 === 3 && review.length > 0
  // Advance review separately: using round % review.length would starve half
  // the completed topics whenever their count divides the review interval.
  const focusRound = review.length ? round - Math.floor((round + 1) / 4) : round
  const selectedSkill = !focus.length ? skills[round % skills.length]
    : reviewing ? review[Math.floor(round / 4) % review.length] : focus[focusRound % focus.length]
  const candidates = hotelQuestions.filter(q => q.skill === selectedSkill && q.id !== previous)
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
      if (value && Array.isArray(value.seen) && value.seen.every(id => typeof id === 'string') && Number.isFinite(value.correct) && Number.isFinite(value.attempts)) {
        const activeIds = new Set(hotelQuestions.filter(q => q.skill === skill).map(q => q.id))
        result[skill] = { ...value, seen: [...new Set(value.seen.filter(id => activeIds.has(id)))] }
      }
    }
    return result
  } catch { return {} }
}

import { randomBytes, randomInt } from 'node:crypto'
import type { RacePhase, RaceView } from '../src/race/types'
import { FINISH, START_DELAY_MS, WINDOW_MS, racePositions, roundResult } from '../src/race/rules'
import { motionAfter, secondsToFinish, type RaceMotion } from '../src/race/kinematics'
import { meaningChoices } from '../src/race/meaningChoices'
export { FINISH, WINDOW_MS, speedFor } from '../src/race/rules'

export type RaceQuestion = { id: string; english: string; audioUrl: string; choices: string[]; correct: number; meaningDistractor?: string }
export type RaceStage = { id: string; title: string; kind?: 'judgement' | 'meaning'; questions: RaceQuestion[] }
type Player = RaceMotion & { id: string; token: string; name: string; lane: number; streak?: number }
type Answer = { choice: number; at: number }
export type Room = {
  version: 2; id: string; host: string; createdAt: number; title: string; phase: RacePhase; players: Player[];
  run?: number; stageId?: string; completedRound?: number;
  pool: RaceQuestion[]; deck: RaceQuestion[]; round: number; opensAt: number; closesAt: number;
  updatedAt: number; answers: Record<string, Answer>; kind?: RaceStage['kind'];
}
export const token = () => randomBytes(24).toString('hex')
export class RaceError extends Error { status = 400 }
function requireThat(value: unknown, message: string): asserts value { if (!value) throw new RaceError(message) }
function nextQuestion(room: Room) {
  if (room.kind === 'judgement') {
    // Balance judgements, not catalogue sizes (each noun has two omissions).
    // Keep Correct on the left and Wrong on the right for quick phone taps.
    const correct = randomInt(2)
    const candidates = room.pool.filter(q => q.correct === correct)
    const q = candidates[randomInt(candidates.length)]
    room.deck.push({ ...q, choices: [...q.choices] })
    room.round++
    room.answers = {}
    return
  }
  // Independent draws allow repeats: two-item pools must not alternate predictably.
  const q = room.pool[randomInt(room.pool.length)]
  const choices = [...q.choices]
  if (room.kind === 'meaning' && q.meaningDistractor && q.meaningDistractor !== choices[q.correct] && randomInt(2) === 1) {
    choices[1 - q.correct] = q.meaningDistractor
  }
  const flip = randomInt(2) === 1
  room.deck.push({ ...q, choices: flip ? choices.reverse() : choices, correct: flip ? 1 - q.correct : q.correct })
  room.round++
  room.answers = {}
}
function validateStage(stage: RaceStage) {
  requireThat(stage.kind ? stage.questions.length >= 2 : stage.questions.length === 2, 'Choose at least two words for this race.')
  if (stage.kind === 'judgement') requireThat(stage.questions.some(q => q.correct === 0) && stage.questions.some(q => q.correct === 1), 'Include correct and wrong sentences.')
  requireThat(stage.questions.every(q => q.choices.length === 2 && (q.correct === 0 || q.correct === 1)), 'Each question needs two choices.')
  if (stage.kind === 'meaning') {
    requireThat(new Set(stage.questions.map(q => q.choices[q.correct])).size >= 2, 'Choose at least two different meanings.')
    requireThat(stage.questions.every(q => new Set(q.choices).size === 2), 'Each question needs two different meanings.')
    return
  }
  const meanings = [...stage.questions[0].choices].sort().join('|')
  requireThat(stage.questions.every(q => [...q.choices].sort().join('|') === meanings), 'Keep the same two meanings for the race.')
  requireThat(new Set(stage.questions.map(q => q.choices[q.correct])).size === 2, 'Include both answer meanings.')
}
export function selectQuestions(stage: RaceStage, questionIds?: unknown): RaceStage {
  let questions = stage.questions
  if (questionIds !== undefined) {
    requireThat(Array.isArray(questionIds) && questionIds.every(id => typeof id === 'string'), 'Choose valid questions from this section.')
    requireThat(new Set(questionIds).size === questionIds.length, 'Choose each question only once.')
    const available = new Set(stage.questions.map(q => q.id))
    requireThat(questionIds.every(id => available.has(id)), 'Choose questions from this section.')
    const selected = new Set(questionIds)
    questions = stage.questions.filter(q => selected.has(q.id))
  }
  const selected = { ...stage, questions }
  validateStage(selected)
  if (selected.kind === 'meaning') selected.questions = meaningChoices(selected.questions)
  validateStage(selected)
  return selected
}
function requireRun(room: Room, run: number) {
  requireThat(Number.isSafeInteger(run) && run > 0 && run === (room.run ?? 1), 'This race has changed. Refresh and try again.')
}
export function createRoom(stage: RaceStage, now = Date.now()): Room {
  stage = selectQuestions(stage)
  return { version: 2, id: randomBytes(5).toString('hex').toUpperCase(), host: token(), createdAt: now,
    run: 1, stageId: stage.id, title: stage.title, phase: 'lobby', players: [], pool: stage.questions.map(q => ({ ...q, choices: [...q.choices] })),
    deck: [], round: -1, opensAt: 0, closesAt: 0, updatedAt: now, answers: {}, kind: stage.kind }
}
export function prepareRace(room: Room, secret: string, stage: RaceStage, run: number, now = Date.now()) {
  requireThat(secret === room.host, 'Only the host can prepare the next race.')
  requireRun(room, run)
  requireThat(room.phase === 'lobby' || room.phase === 'finished', 'Finish the current race before preparing another.')
  stage = selectQuestions(stage)
  room.run = (room.run ?? 1) + 1
  room.stageId = stage.id
  room.title = stage.title
  room.kind = stage.kind
  room.pool = stage.questions.map(q => ({ ...q, choices: [...q.choices] }))
  room.deck = []
  delete room.completedRound
  room.round = -1
  room.phase = 'lobby'
  room.answers = {}
  room.opensAt = 0
  room.closesAt = 0
  room.updatedAt = now
  for (const player of room.players) {
    player.metres = 0
    player.speed = 0
    player.targetSpeed = 0
    player.accelerationRemainingMs = 0
    player.streak = 0
  }
}
export function joinRoom(room: Room, name: string, playerToken: string): Player {
  const existing = room.players.find(p => p.token === playerToken)
  if (existing) return existing
  requireThat(room.phase === 'lobby', 'The race has started. Join the next race.')
  requireThat(room.players.length < 10, 'All ten lanes are taken.')
  const clean = name.trim().replace(/\s+/g, ' ')
  requireThat(clean.length > 0 && clean.length <= 24 && !/[\p{Cc}\p{Cf}]/u.test(clean), 'Enter a name of 1–24 characters.')
  requireThat(!room.players.some(p => p.name.toLocaleLowerCase() === clean.toLocaleLowerCase()), 'That name is taken. Add your initial.')
  requireThat(/^[a-f0-9]{48}$/.test(playerToken), 'Please reload and join again.')
  const player = { id: randomBytes(8).toString('hex'), token: playerToken, name: clean, lane: room.players.length, metres: 0, speed: 0, targetSpeed: 0, accelerationRemainingMs: 0 }
  room.players.push(player)
  return player
}
// Resolve everybody against the same closing instant, after movement at the old
// speeds has been integrated. Arrival time affects the gain, never its start time.
function settleRound(room: Room, at: number) {
  const positions = racePositions(room.players)
  for (const [index, player] of room.players.entries()) {
    const answer = room.answers[player.id]
    const correct = !!answer && answer.choice === room.deck[room.round].correct
    Object.assign(player, roundResult(player, correct, answer ? answer.at - room.opensAt : WINDOW_MS, positions[index], room.players.length))
  }
  room.opensAt = at
  room.closesAt = at + WINDOW_MS
  nextQuestion(room)
}
// Integrate actual speed over elapsed time, splitting at every question boundary.
// Persisted timestamps let a delayed poll/restart catch up without losing distance.
export function advanceRace(room: Room, now = Date.now()): boolean {
  if (room.phase !== 'answering' || now <= room.updatedAt) return false
  let changed = false
  while (room.phase === 'answering' && now > room.updatedAt) {
    const until = Math.min(now, room.closesAt)
    const duration = (until - room.updatedAt) / 1000
    const toFinish = Math.min(...room.players.map(p => secondsToFinish(p, FINISH)))
    const elapsed = Math.min(duration, toFinish)
    for (const p of room.players) Object.assign(p, motionAfter(p, elapsed))
    room.updatedAt += elapsed * 1000
    changed = true
    if (toFinish <= duration + 1e-9) {
      for (const p of room.players) if (p.metres >= FINISH - 1e-8) p.metres = FINISH
      room.phase = 'finished'; break
    }
    // The closing instant belongs to this question: a tap exactly at 10s
    // receives a zero boost. Roll over strictly after it.
    if (until >= room.closesAt && now > room.closesAt) {
      settleRound(room, room.closesAt)
    }
  }
  return changed
}
export function command(room: Room, secret: string, action: string, round: number, now = Date.now(), run = room.run ?? 1) {
  requireThat(secret === room.host, 'Only the host can control the race.')
  requireRun(room, run)
  if (action === 'finish') {
    advanceRace(room, now); room.phase = 'finished'; return
  }
  requireThat(round === room.round, 'This round has changed. Please try again.')
  requireThat(action === 'start' && room.phase === 'lobby', 'This race is already running.')
  requireThat(room.players.length, 'Wait for a player to join.')
  nextQuestion(room)
  room.phase = 'answering'
  room.opensAt = now + START_DELAY_MS
  room.closesAt = room.opensAt + WINDOW_MS
  room.updatedAt = room.opensAt
}
export function answer(room: Room, secret: string, round: number, choice: number, now = Date.now(), run = room.run ?? 1) {
  const player = room.players.find(p => p.token === secret)
  requireThat(player, 'Join the race first.')
  requireRun(room, run)
  advanceRace(room, now)
  // The final tap can be retried after its response was lost. The whole
  // previous round was accepted, so acknowledge it without applying it twice.
  if (round === room.completedRound && round === room.round - 1) return
  requireThat(round === room.round, 'That question has finished.')
  if (room.answers[player.id]) return // Idempotent first tap; never change speed twice.
  requireThat(room.phase === 'answering' && now >= room.opensAt && now <= room.closesAt, 'The answer window is closed.')
  requireThat(choice === 0 || choice === 1, 'Choose one answer.')
  room.answers[player.id] = { choice, at: now }
  if (room.players.every(p => room.answers[p.id])) {
    room.completedRound = room.round
    // Concurrent requests can commit out of arrival order; never rewind motion.
    const nextAt = Math.max(now, room.updatedAt)
    settleRound(room, nextAt)
  }
}
export function viewRoom(room: Room, secret: string, now = Date.now()): RaceView {
  const host = secret === room.host, me = room.players.find(p => p.token === secret)
  const q = room.deck[room.round]
  return { id: room.id, run: room.run ?? 1, stageId: room.stageId ?? '', title: room.title, phase: room.phase, round: room.round, finish: FINISH, serverNow: now,
    opensAt: room.opensAt, closesAt: room.closesAt, motionAt: room.updatedAt,
    players: room.players.map(p => ({ id: p.id, name: p.name, lane: p.lane, metres: p.metres, speed: p.speed, targetSpeed: p.targetSpeed ?? p.speed, accelerationRemainingMs: p.accelerationRemainingMs ?? 0, answered: !!room.answers[p.id], streak: p.streak ?? 0 })),
    ...(q ? { question: { id: `${room.round}`, choices: q.choices, ...(host ? { english: q.english, audioUrl: q.audioUrl } : {}) } } : {}),
    ...(host ? { questionIds: room.pool.map(question => question.id) } : {}),
    ...(me ? { me: { id: me.id, choice: room.answers[me.id]?.choice } } : {}) }
}

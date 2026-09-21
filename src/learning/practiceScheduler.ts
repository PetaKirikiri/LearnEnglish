import { wordRarity, RARITIES } from './wordRarity'
import { compareContent, questionBlock, questionFrequency, questionWord } from './contentOrder'
import { hasLearnedQuestion, type LearningMemory } from './learningMemory'
import type { QuizQuestion } from './quizContent'

// Content priority chooses the pairs; saved evidence chooses the current pair.
export function practiceFocus(bank: readonly QuizQuestion[], memory: LearningMemory) {
  const grouped = new Map<string, QuizQuestion[]>()
  for (const q of [...bank].sort(compareContent)) {
    const key = questionBlock(q)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(q)
  }
  const blocks = [...grouped.values()]
  for (let i = 0; i < blocks.length; i += 2) {
    const focus = blocks.slice(i, i + 2)
    if (focus.some(block => block.some(q => !hasLearnedQuestion(memory[q.id])))) {
      return { focus, review: blocks.slice(0, i).flat(), pair: i / 2 + 1 }
    }
  }
  return { focus: [] as QuizQuestion[][], review: blocks.flat(), pair: null }
}

export function selectPracticeQuestions(bank: readonly QuizQuestion[], memory: LearningMemory, random: () => number, limit = 10) {
  const { focus, review } = practiceFocus(bank, memory)
  const lastSeen = (q: QuizQuestion) => memory[q.id]?.lastAnsweredAt ?? 0
  const needsRepair = (q: QuizQuestion) => Boolean(memory[q.id]?.lastWrongAt !== undefined && (memory[q.id]?.correctPasses?.length ?? 0) < 2)
  const pendingReview = [...review].sort((a, b) => Number(needsRepair(b)) - Number(needsRepair(a)) || lastSeen(a) - lastSeen(b) || compareContent(a, b))
  const reviewQueue: QuizQuestion[] = []
  while (pendingReview.length) {
    const previous = reviewQueue.at(-1)
    const different = previous ? pendingReview.findIndex(q => questionBlock(q) !== questionBlock(previous)) : 0
    reviewQueue.push(pendingReview.splice(Math.max(0, different), 1)[0])
  }
  if (!focus.length) return reviewQueue.slice(0, limit)

  const queues = focus.map(block => [...block].sort((a, b) =>
    Number(hasLearnedQuestion(memory[a.id])) - Number(hasLearnedQuestion(memory[b.id]))
    || lastSeen(a) - lastSeen(b) || compareContent(a, b)))
  const reviewCount = Math.min(Math.floor(limit * 0.3), reviewQueue.length)
  const focusCount = Math.min(limit - reviewCount, queues.reduce((n, q) => n + q.length, 0))
  let schedule = Array.from({ length: focusCount }, (_, i) => i % focus.length)
  // Balanced, but not a predictable answer-alternation trick.
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = [...schedule]
    for (let i = candidate.length - 1; i > 1; i--) {
      const j = 1 + Math.floor(random() * i)
      ;[candidate[i], candidate[j]] = [candidate[j], candidate[i]]
    }
    if (!candidate.some((value, i) => i >= 2 && value === candidate[i - 1] && value === candidate[i - 2])) {
      schedule = candidate
      break
    }
  }
  const selected: QuizQuestion[] = []
  let reviewUsed = 0
  while (selected.length < limit && (schedule.length || reviewQueue.length)) {
    if ((!schedule.length || selected.length % 3 === 2) && reviewUsed < reviewCount) {
      selected.push(reviewQueue.shift()!)
      reviewUsed++
    } else if (schedule.length) {
      const preferred = queues[schedule.shift()!]
      const q = preferred.shift() ?? queues.find(queue => queue.length)?.shift()
      if (q) selected.push(q)
    } else break
  }
  return selected
}

// One discovery at the end of every fifth round. The rest of the course retains
// its frequency-first focus and review. Revisit an encountered word before
// introducing another, so discoveries can become earned collection items.
export function addRareEncounter(selected: readonly QuizQuestion[], bank: readonly QuizQuestion[], memory: LearningMemory, round: number, random: () => number) {
  if ((round + 1) % 5 !== 0 || selected.length < 2) return selected
  const { focus } = practiceFocus(bank, memory)
  if (!focus.length) return selected
  const focusRank = Math.max(...focus.flat().map(q => questionFrequency(q).rank))
  const focusTier = Math.max(...focus.flat().map(q => {
    const tier = wordRarity(questionWord(q))
    return tier ? RARITIES.indexOf(tier) : -1
  }))
  const candidates = bank.filter(q => {
    const rank = questionFrequency(q).rank
    const rarity = wordRarity(questionWord(q))
    return q.mode === 'vocabulary' && q.prompt === q.spokenText && q.choices.length === 4
      && rarity !== null && RARITIES.indexOf(rarity) > focusTier && rank > focusRank
      && !selected.some(item => questionBlock(item) === questionBlock(q))
  })
  const unfinished = candidates.filter(q => {
    const record = memory[q.id]
    return record && (new Set(record.correctPasses).size < 5 || new Set(record.correctDates).size < 3)
  }).sort((a,b) => memory[a.id].lastAnsweredAt - memory[b.id].lastAnsweredAt || compareContent(a,b))
  const unseen = candidates.filter(q => !memory[q.id])
  const encounter = unfinished[0] ?? unseen[Math.min(unseen.length - 1, Math.floor(random() * unseen.length))]
  return encounter ? [...selected.slice(0, -1), encounter] : selected
}

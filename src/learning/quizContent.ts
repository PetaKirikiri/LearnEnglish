import { readings } from '../content/readings'
import { buildWordData, parseWords } from '../lib/wordData'

export type QuizMode = 'vocabulary' | 'sentences'

export type QuizQuestion = {
  id: string
  mode: QuizMode
  instruction: string
  prompt: string
  choices: readonly string[]
  answer: string
  sourceTitle: string
  example: string
  spokenText: string
  audioUrl: string
}

type StorySentence = {
  id: string
  text: string
  sourceTitle: string
}

const questionsPerRound = 10

// Deliberately reviewed for the meaning used in these stories. The larger admin
// dictionary remains useful for analysis, but its automatic glosses are not safe
// enough to teach from without context.
const lessonThaiTranslations: Readonly<Record<string, string>> = {
  airport: 'สนามบิน',
  apartments: 'อพาร์ตเมนต์',
  basketball: 'บาสเกตบอล',
  beach: 'ชายหาด',
  bird: 'นก',
  birds: 'นก',
  birdwatching: 'การดูนก',
  bread: 'ขนมปัง',
  brother: 'พี่ชายหรือน้องชาย',
  buses: 'รถโดยสาร',
  cars: 'รถยนต์',
  cats: 'แมว',
  cave: 'ถ้ำ',
  cheese: 'ชีส',
  child: 'เด็ก',
  cities: 'เมืองต่าง ๆ',
  city: 'เมือง',
  climate: 'ภูมิอากาศ',
  cold: 'หนาว',
  corn: 'ข้าวโพด',
  countryside: 'ชนบท',
  diary: 'สมุดบันทึก',
  doctor: 'แพทย์',
  elevator: 'ลิฟต์',
  exercise: 'การออกกำลังกาย',
  family: 'ครอบครัว',
  farms: 'ฟาร์ม',
  father: 'พ่อ',
  fish: 'ปลา',
  fishing: 'การตกปลา',
  folders: 'แฟ้ม',
  food: 'อาหาร',
  friends: 'เพื่อน',
  gate: 'ประตู',
  grandfather: 'ปู่หรือตา',
  grandmother: 'ย่าหรือยาย',
  handouts: 'เอกสารแจก',
  hills: 'เนินเขา',
  hobby: 'งานอดิเรก',
  home: 'บ้าน',
  houses: 'บ้าน',
  island: 'เกาะ',
  meat: 'เนื้อสัตว์',
  midnight: 'เที่ยงคืน',
  morning: 'ตอนเช้า',
  mother: 'แม่',
  mountain: 'ภูเขา',
  nest: 'รัง',
  notebooks: 'สมุด',
  ocean: 'มหาสมุทร',
  pancakes: 'แพนเค้ก',
  pencils: 'ดินสอ',
  people: 'ผู้คน',
  photographs: 'รูปถ่าย',
  pilot: 'นักบิน',
  plane: 'เครื่องบิน',
  platform: 'ชานชาลา',
  police: 'ตำรวจ',
  questions: 'คำถาม',
  rocks: 'หิน',
  salt: 'เกลือ',
  sauce: 'ซอส',
  school: 'โรงเรียน',
  shape: 'รูปร่าง',
  sister: 'พี่สาวหรือน้องสาว',
  skiing: 'การเล่นสกี',
  sky: 'ท้องฟ้า',
  station: 'สถานี',
  stars: 'ดวงดาว',
  storms: 'พายุ',
  streets: 'ถนน',
  suburbs: 'ชานเมือง',
  suitcase: 'กระเป๋าเดินทาง',
  sun: 'ดวงอาทิตย์',
  supplies: 'อุปกรณ์การเรียน',
  sweaters: 'เสื้อกันหนาว',
  teacher: 'ครู',
  temperature: 'อุณหภูมิ',
  thunder: 'ฟ้าร้อง',
  ticket: 'ตั๋ว',
  tracks: 'รางรถไฟ',
  traffic: 'การจราจร',
  train: 'รถไฟ',
  trains: 'รถไฟ',
  treehouses: 'บ้านต้นไม้',
  trip: 'การเดินทาง',
  vinegar: 'น้ำส้มสายชู',
  volcano: 'ภูเขาไฟ',
  warm: 'อบอุ่น',
  water: 'น้ำ',
  weather: 'สภาพอากาศ',
  winter: 'ฤดูหนาว',
  woods: 'ป่า',
}

const excludedVocabulary = new Set([
  'a', 'about', 'above', 'all', 'also', 'an', 'and', 'are', 'as', 'at', 'be', 'before', 'but',
  'by', 'can', 'do', 'does', 'for', 'from', 'have', 'he', 'her', 'here', 'him', 'his', 'how',
  'i', "i'm", 'if', 'in', 'is', 'it', "it's", 'its', 'me', 'my', 'no', 'not', 'of', 'on',
  'one', 'or', 'our', 'she', "she's", 'so', 'some', 'that', "that's", 'the', 'their', 'them',
  'there', 'these', 'they', 'this', 'those', 'to', 'too', 'up', 'us', 'very', 'was', 'we',
  "we're", 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'why', 'will', 'with',
  'would', 'you', 'your', 'yourself',
  'alta', 'bali', 'barbara', 'britain', 'cappadocia', 'chicago', 'colorado', 'cunha', 'diamond',
  'drina', 'east', 'inga', 'italy', 'jessica', 'jin', 'korea', 'luisa', 'marilyn', 'mexican',
  'mexico', 'norway', 'pohon', 'roger', 'rome', 'rona', 'rumah', 'seoul', 'serbia', 'smith',
  'stephanie', 'tristan', 'turkey', 'usa',
])

const contrastGroups: readonly (readonly string[])[] = [
  ['a', 'the'],
  ['is', 'are', 'was', 'were'],
  ['my', 'your', 'his', 'her', 'our', 'their'],
  ['this', 'that', 'these', 'those'],
  ['in', 'on', 'at', 'over', 'under', 'above', 'below', 'inside', 'outside'],
  ['before', 'after'],
  ['up', 'down'],
  ['can', 'will', 'would'],
  ['mother', 'father', 'brother', 'sister'],
  ['grandmother', 'grandfather'],
  ['train', 'trains', 'bus', 'buses', 'car', 'cars', 'plane', 'planes'],
  ['house', 'houses', 'home', 'homes', 'apartment', 'apartments'],
  ['city', 'cities', 'countryside'],
  ['morning', 'afternoon', 'night', 'midnight'],
  ['hot', 'cold', 'warm', 'chilly'],
  ['bird', 'birds', 'cat', 'cats'],
  ['school', 'home'],
  ['sun', 'stars'],
  ['food', 'foods'],
  ['water', 'ground'],
]

function createRandom(seed: number) {
  let value = (seed || 1) >>> 0

  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return value / 4294967296
  }
}

function shuffle<T>(items: readonly T[], random: () => number) {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }

  return copy
}

function getStorySentences(): StorySentence[] {
  return readings.flatMap((reading) => {
    let sentenceIndex = 0

    return reading.paragraphs.flatMap((paragraph) => {
      const normalized = paragraph
        .replaceAll('\n', ' ')
        .replace(/^\s*[•—]\s*/gu, '')
        .replace(/\s+/gu, ' ')
        .trim()
      const sentences = normalized.match(/[^.!?]+[.!?]+/gu) ?? []

      return sentences
        .map((sentence) => sentence.trim())
        .filter((sentence) => {
          const wordCount = parseWords(sentence).length
          return wordCount >= 5 && wordCount <= 22 && !sentence.includes('@')
        })
        .map((text) => ({
          id: `${reading.id}-${sentenceIndex++}`,
          text,
          sourceTitle: reading.title,
        }))
    })
  })
}

function includesWord(text: string, word: string) {
  return parseWords(text).includes(word)
}

function replaceFirstWord(text: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
  const pattern = new RegExp(`(^|[^\\p{L}])${escaped}(?=[^\\p{L}]|$)`, 'iu')
  return text.replace(pattern, '$1_____')
}

function createSentencePool(random: () => number): QuizQuestion[] {
  const sentences = getStorySentences()
  const corpusWords = new Set(sentences.flatMap(({ text }) => parseWords(text)))

  const pool = sentences.flatMap((sentence) => {
    const sentenceWords = new Set(parseWords(sentence.text))
    const possibleGroups = contrastGroups.filter((group) => group.some((word) => sentenceWords.has(word)))
    if (possibleGroups.length === 0) return []

    return possibleGroups.flatMap((group) => group
      .filter((word) => sentenceWords.has(word))
      .flatMap((answer) => {
        const distractors = group.filter((word) => word !== answer && corpusWords.has(word))
        if (distractors.length === 0) return []

        const choices = shuffle([answer, ...shuffle(distractors, random).slice(0, 3)], random)

        return [{
          id: `sentence-${sentence.id}-${answer}`,
          mode: 'sentences' as const,
          instruction: 'Choose the missing word',
          prompt: replaceFirstWord(sentence.text, answer),
          choices,
          answer,
          sourceTitle: sentence.sourceTitle,
          example: sentence.text,
          spokenText: sentence.text,
          audioUrl: `/audio/lessons/sentence-${sentence.id}.wav`,
        }]
      }))
  })

  return shuffle(pool, random)
}

function createVocabularyPool(random: () => number): QuizQuestion[] {
  const sentences = getStorySentences()
  const ranking = buildWordData(readings).ranking
  const candidates = ranking.filter(({ word }) => (
    !excludedVocabulary.has(word)
    && word.length >= 3
    && Boolean(lessonThaiTranslations[word])
  ))
  const uniqueTranslations = candidates.filter(({ word }, index, entries) => (
    entries.findIndex(({ word: otherWord }) => lessonThaiTranslations[otherWord] === lessonThaiTranslations[word]) === index
  ))

  const pool = uniqueTranslations.flatMap(({ word, count }, index) => {
    const example = sentences.find(({ text }) => includesWord(text, word))
    if (!example) return []

    const nearbyCandidates = uniqueTranslations
      .slice(Math.max(0, index - 12), index + 13)
      .filter(({ word: otherWord }) => otherWord !== word)
    const distractors = shuffle(nearbyCandidates, random).slice(0, 3)
    if (distractors.length < 3) return []

    const englishToThai = index % 2 === 0
    const answer = englishToThai ? lessonThaiTranslations[word] : word
    const otherChoices = distractors.map(({ word: distractor }) => (
      englishToThai ? lessonThaiTranslations[distractor] : distractor
    ))

    return [{
      id: `vocabulary-${word}-${count}`,
      mode: 'vocabulary' as const,
      instruction: englishToThai ? 'Choose the Thai meaning' : 'Choose the English word',
      prompt: englishToThai ? word : lessonThaiTranslations[word],
      choices: shuffle([answer, ...otherChoices], random),
      answer,
      sourceTitle: example.sourceTitle,
      example: example.text,
      spokenText: word,
      audioUrl: `/audio/lessons/vocabulary-${word}.wav`,
    }]
  })

  return shuffle(pool, random)
}

export function createQuizRound(
  mode: QuizMode,
  round = 0,
  reviewQuestionIds: readonly string[] = [],
): readonly QuizQuestion[] {
  const random = createRandom(20260912 + round * 97 + (mode === 'vocabulary' ? 11 : 29))
  const pool = mode === 'vocabulary'
    ? createVocabularyPool(random)
    : createSentencePool(random)

  const chosen: QuizQuestion[] = []
  const usedSources = new Set<string>()

  for (const questionId of reviewQuestionIds.slice(0, 5)) {
    const reviewQuestion = pool.find(({ id }) => id === questionId)
    if (reviewQuestion && !chosen.some(({ id }) => id === reviewQuestion.id)) {
      chosen.push(reviewQuestion)
      usedSources.add(reviewQuestion.sourceTitle)
    }
  }

  for (const question of pool) {
    if (chosen.length >= questionsPerRound) break
    if (!usedSources.has(question.sourceTitle)) {
      chosen.push(question)
      usedSources.add(question.sourceTitle)
    }
  }

  for (const question of pool) {
    if (chosen.length >= questionsPerRound) break
    if (!chosen.some(({ id }) => id === question.id)) chosen.push(question)
  }

  return chosen
}

export function getLessonAudioItems() {
  const random = createRandom(20260912)
  const questions = [...createVocabularyPool(random), ...createSentencePool(random)]
  const byUrl = new Map(questions.map(({ audioUrl, spokenText }) => [audioUrl, { audioUrl, spokenText }]))
  return Array.from(byUrl.values())
}

// The admin catalogue uses the same complete pools as the learner's rounds.
export function getQuizCatalogue() {
  const random = createRandom(20260912)
  return {
    vocabulary: createVocabularyPool(random).sort((a, b) => a.spokenText.localeCompare(b.spokenText)),
    sentences: createSentencePool(random).sort((a, b) => a.sourceTitle.localeCompare(b.sourceTitle) || a.example.localeCompare(b.example) || a.answer.localeCompare(b.answer)),
  }
}

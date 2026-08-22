import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { readings } from '../src/content/readings'
import { buildWordData } from '../src/lib/wordData'

const batchSize = 40
const words = buildWordData(readings).ranking.map(({ word }) => word)
const translations: Record<string, string> = {}

for (let index = 0; index < words.length; index += batchSize) {
  const batch = words.slice(index, index + batchSize)
  const parameters = new URLSearchParams({
    client: 'gtx',
    sl: 'en',
    tl: 'th',
    dt: 't',
    q: batch.join('\n'),
  })
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?${parameters}`,
  )

  if (!response.ok) {
    throw new Error(`Translation request failed with ${response.status}`)
  }

  const result = (await response.json()) as [Array<[string]>]
  const translatedLines = result[0]
    .map(([translatedText]) => translatedText)
    .join('')
    .split('\n')
    .filter((line, lineIndex, lines) => line || lineIndex < lines.length - 1)

  if (translatedLines.length !== batch.length) {
    throw new Error(
      `Expected ${batch.length} translations, received ${translatedLines.length}`,
    )
  }

  batch.forEach((word, batchIndex) => {
    translations[word] = translatedLines[batchIndex]
  })
}

Object.assign(translations, {
  a: 'หนึ่ง',
  an: 'หนึ่ง',
  the: 'นั้น',
})

const output = `// Generated dictionary-style English-to-Thai glosses.\nexport const thaiTranslations: Readonly<Record<string, string>> = ${JSON.stringify(translations, null, 2)}\n`

await writeFile(
  resolve('src/content/thaiTranslations.generated.ts'),
  output,
  'utf8',
)

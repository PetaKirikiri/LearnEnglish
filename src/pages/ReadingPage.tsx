import { useState } from 'react'
import { readings } from '../content/readings'

export default function ReadingPage() {
  const [selectedReadingId, setSelectedReadingId] = useState(readings[0].id)
  const reading =
    readings.find(({ id }) => id === selectedReadingId) ?? readings[0]
  const readingNumber = readings.findIndex(({ id }) => id === reading.id) + 1
  const readingLabel = reading.chapter
    ? `Story ${reading.chapter}`
    : `Story ${readingNumber}`

  return (
    <div>
      <nav aria-label="Stories" className="mx-auto mb-6 max-w-3xl">
        <label
          htmlFor="story-selector"
          className="mb-2 block text-sm font-bold text-slate-600"
        >
          Choose a story
        </label>
        <select
          id="story-selector"
          value={reading.id}
          onChange={(event) => setSelectedReadingId(event.target.value)}
          className="w-full cursor-pointer appearance-none rounded-2xl border-0 bg-white px-5 py-4 text-base font-bold text-slate-800 shadow-md outline-none ring-blue-600 transition focus:ring-2"
        >
          {readings.map((story, index) => (
            <option key={story.id} value={story.id}>
              Story {story.chapter ?? index + 1}: {story.title}
            </option>
          ))}
        </select>
      </nav>

      <article className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70">
        <header className="bg-blue-700 px-7 py-10 text-white sm:px-12">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-blue-100">
            Fifa English · {readingLabel}
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            {reading.title}
          </h1>
        </header>

        <div className="space-y-6 px-7 py-10 text-lg leading-8 sm:px-12 sm:text-xl sm:leading-9">
          {reading.paragraphs.map((paragraph) => (
            <p key={paragraph} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </div>
  )
}

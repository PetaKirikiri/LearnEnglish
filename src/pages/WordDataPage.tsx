import { thaiTranslations } from '../content/languageData'
import type { WordData } from '../lib/wordData'

type WordDataPageProps = {
  wordData: WordData
}

export default function WordDataPage({ wordData }: WordDataPageProps) {
  return (
    <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70">
      <header className="bg-blue-700 px-7 py-9 text-white sm:px-12">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-blue-100">
          All saved stories
        </p>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Word Data
        </h1>
        <div className="mt-6 flex gap-8 text-blue-50">
          <p>
            <strong className="block text-2xl text-white">
              {wordData.totalWords.toLocaleString()}
            </strong>
            total words
          </p>
          <p>
            <strong className="block text-2xl text-white">
              {wordData.uniqueWords.toLocaleString()}
            </strong>
            unique words
          </p>
        </div>
      </header>

      <div className="px-5 py-6 sm:px-10">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-100 text-sm uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-4 font-bold">Rank</th>
                <th className="px-5 py-4 font-bold">Word</th>
                <th className="px-5 py-4 font-bold">Thai Translation</th>
                <th className="px-5 py-4 text-right font-bold">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wordData.ranking.map(({ word, count }, index) => (
                <tr key={word} className="hover:bg-blue-50/60">
                  <td className="px-5 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-5 py-3 text-lg font-semibold text-slate-900">
                    {word}
                  </td>
                  <td lang="th" className="px-5 py-3 text-lg text-slate-700">
                    {thaiTranslations[word]}
                  </td>
                  <td className="px-5 py-3 text-right text-lg font-bold text-blue-700">
                    {count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

import type { DeterminerCount } from '../lib/determinerData'

type DeterminersPageProps = {
  determiners: readonly DeterminerCount[]
}

export default function DeterminersPage({ determiners }: DeterminersPageProps) {
  const totalOccurrences = determiners.reduce(
    (total, { count }) => total + count,
    0,
  )

  return (
    <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70">
      <header className="bg-blue-700 px-7 py-9 text-white sm:px-12">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-blue-100">
          Part of speech · D
        </p>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Determiners
        </h1>
        <div className="mt-6 flex gap-8 text-blue-50">
          <p>
            <strong className="block text-2xl text-white">
              {totalOccurrences.toLocaleString()}
            </strong>
            occurrences
          </p>
          <p>
            <strong className="block text-2xl text-white">
              {determiners.length.toLocaleString()}
            </strong>
            unique determiners
          </p>
        </div>
      </header>

      <div className="px-5 py-6 sm:px-10">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-100 text-sm uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-4 font-bold">Word</th>
                <th className="px-5 py-4 text-center font-bold">POS</th>
                <th className="px-5 py-4 text-right font-bold">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {determiners.map(({ word, pos, count }) => (
                <tr key={word} className="hover:bg-blue-50/60">
                  <td className="px-5 py-3 text-lg font-semibold text-slate-900">
                    {word}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-black text-blue-800">
                      {pos}
                    </span>
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

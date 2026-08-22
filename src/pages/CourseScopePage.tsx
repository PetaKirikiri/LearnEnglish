import { courseScope } from '../content/courseScope'

function ListCell({ items }: { items: readonly string[] }) {
  return (
    <ul className="min-w-48 space-y-1">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export default function CourseScopePage() {
  return (
    <section className="mx-auto max-w-[96rem] overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70">
      <header className="bg-blue-700 px-7 py-9 text-white sm:px-12">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-blue-100">
          Fifa English course guide
        </p>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Scope &amp; Sequence
        </h1>
        <p className="mt-4 max-w-3xl text-blue-100">
          The vocabulary, grammar, and learning outcomes for Units 1–10.
        </p>
      </header>

      <div className="overflow-x-auto p-5 sm:p-8">
        <table className="w-full min-w-[110rem] border-collapse text-left align-top text-sm">
          <thead className="bg-slate-900 text-xs uppercase tracking-wider text-white">
            <tr>
              {['Unit / Page', 'Vocabulary', 'Grammar & Structures', 'Listening', 'Speaking', 'Reading', 'Writing', 'Pronunciation', 'Project'].map((heading) => (
                <th key={heading} className="border border-slate-700 px-4 py-4 font-bold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courseScope.map((unit) => (
              <tr key={unit.unit} className="odd:bg-white even:bg-slate-50">
                <th className="w-56 border border-slate-200 px-4 py-5 align-top">
                  <span className="mb-2 block text-3xl font-black text-blue-700">
                    {String(unit.unit).padStart(2, '0')}
                  </span>
                  <span className="block text-base font-black uppercase text-slate-900">
                    {unit.title}
                  </span>
                  <span className="mt-2 block font-normal text-slate-500">
                    {unit.pages}
                  </span>
                </th>
                <td className="border border-slate-200 px-4 py-5 align-top"><ListCell items={unit.vocabulary} /></td>
                <td className="border border-slate-200 px-4 py-5 align-top"><ListCell items={unit.grammar} /></td>
                {[unit.listening, unit.speaking, unit.reading, unit.writing, unit.pronunciation, unit.project].map((value, index) => (
                  <td key={`${unit.unit}-${index}`} className="min-w-44 border border-slate-200 px-4 py-5 align-top leading-6">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

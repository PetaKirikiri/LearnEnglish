export type TimelineTense = 'past' | 'present' | 'future'
const stops: TimelineTense[] = ['past', 'present', 'future']

/** A time reference, not another word selector. The chosen verb sets the marker. */
export default function TenseTimeline({ tense }: { tense: TimelineTense }) {
  return <span className="cw-tense-timeline" data-tense={tense} aria-hidden="true">
    {stops.map((stop) => <span key={stop} className={`cw-tense-stop${stop === tense ? ' is-current' : ''}`}>
      <span className="cw-tense-notch" />
    </span>)}
  </span>
}

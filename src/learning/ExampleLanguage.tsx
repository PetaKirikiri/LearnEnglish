import './exampleLanguage.css'

export type ExampleUnit = {english:string;thai:string}

/** Shared example-text layout: source / aligned meaning / natural translation.
 * Units are authored in context; never zip a Thai sentence to English words.
 * ** emphasis may cross unit boundaries (or begin inside an inflected word).
 */
export default function ExampleLanguage({english,thai,units}:{english:string;thai:string;units:readonly ExampleUnit[]}) {
  const spans=english.split('**').map((text,index,parts)=>{
    const start=parts.slice(0,index).join('').length
    return {text,start,end:start+text.length,marked:index%2===1}
  })
  const plain=spans.map(span=>span.text).join('')
  if(units.map(unit=>unit.english).join(' ')!==plain) throw new Error(`Example alignment does not match: ${plain}`)
  return <div className="example-language">
    <p className="bird-english example-alignment" lang="en" aria-label={plain}>{units.map((unit,index)=>{
      const start=units.slice(0,index).reduce((sum,previous)=>sum+previous.english.length+1,0),end=start+unit.english.length
      return <span className="example-unit" key={index}>
        <span className="example-source">{spans.filter(span=>span.start<end&&span.end>start).map((span,i)=>{
          const text=span.text.slice(Math.max(start,span.start)-span.start,Math.min(end,span.end)-span.start)
          return span.marked?<strong key={i}>{text}</strong>:<span key={i}>{text}</span>
        })}</span>
        <span className="example-gloss" lang="th" title={unit.thai==='—'?'ภาษาไทยไม่มีคำแปลแยกตรงนี้':undefined}>{unit.thai}</span>
      </span>
    })}</p>
    <p className="bird-thai example-translation" lang="th">{thai}</p>
  </div>
}

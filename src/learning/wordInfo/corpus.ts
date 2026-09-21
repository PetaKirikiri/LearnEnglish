export function countNeighbours(texts: readonly string[]) {
  const result = new Map<string,{occurrences:number;before:Map<string,number>;after:Map<string,number>}>()
  const seen = new Set<string>()
  for(const text of texts) {
    // Gaps, sentence endings, example separators and Thai text break adjacency.
    const cleaned=text.replace(/^[A-Z]:\s*/gm,'').replace(/\S+@\S+/g,' ').replace(/\b[ap]\.m\./gi,' ').replace(/\b\d+(?:st|nd|rd|th)\b/gi,' ')
    for(const segment of cleaned.split(/[.!?;\n/→_ก-๙0-9]+/)) {
      const words=(segment.match(/[A-Za-z]+(?:[’'][A-Za-z]+)*/g)??[]).map(w=>w.toLowerCase().replaceAll('’',"'"))
      const signature=words.join(' ')
      if(!signature||seen.has(signature))continue
      seen.add(signature)
      words.forEach((word,index)=>{
        const row=result.get(word)??{occurrences:0,before:new Map(),after:new Map()}
        row.occurrences++
        const previous=words[index-1],next=words[index+1]
        if(previous)row.before.set(previous,(row.before.get(previous)??0)+1)
        if(next)row.after.set(next,(row.after.get(next)??0)+1)
        result.set(word,row)
      })
    }
  }
  return result
}
export function rankedNeighbours(values:Map<string,number>) {
  return [...values].map(([word,count])=>({word,count})).sort((a,b)=>b.count-a.count||a.word.localeCompare(b.word)).slice(0,5)
}

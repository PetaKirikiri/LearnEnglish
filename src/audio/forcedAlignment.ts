import {parseSentenceTiming,type SentenceTiming} from './sentenceTiming'

/** CTC forced alignment of known text, using the same English acoustic model as WhisperX. */
export function alignCTC(text:string,logits:ArrayLike<number>,frames:number,vocabularySize:number,labels:Record<string,string>,duration:number,blank=0):SentenceTiming{
 const dictionary=new Map(Object.entries(labels).map(([id,label])=>[label.toUpperCase(),Number(id)]))
 const characters:Array<{id:number;offset:number}>=[]
 for(let offset=0;offset<text.length;offset++){
  const c=text[offset].toUpperCase(),label=/\s/.test(c)?'|':c
  const id=dictionary.get(label)
  if(id!==undefined)characters.push({id,offset})
  else if(/[\p{L}\p{N}]/u.test(c))throw new Error('Unsupported alignment character')
 }
 while(characters.at(-1)?.id===dictionary.get('|'))characters.pop()
 if(!characters.length||frames<characters.length)throw new Error('Audio too short to align')
 const states=characters.length*2+1,paths=new Uint8Array(frames*states)
 let previous=new Float64Array(states).fill(-Infinity)
 previous[0]=0
 for(let t=0;t<frames;t++){
  const next=new Float64Array(states).fill(-Infinity)
  for(let state=0;state<states;state++){
   const id=state%2?characters[(state-1)/2].id:blank
   let score=previous[state],step=0
   if(state>0&&previous[state-1]>score){score=previous[state-1];step=1}
   if(state>1&&state%2&&id!==characters[(state-3)/2].id&&previous[state-2]>score){score=previous[state-2];step=2}
   next[state]=score+Number(logits[t*vocabularySize+id]);paths[t*states+state]=step
  }
  // Per-frame normalization keeps long recordings numerically stable.
  let maximum=-Infinity;for(const value of next)maximum=Math.max(maximum,value)
  for(let state=0;state<states;state++)next[state]-=maximum
  previous=next
 }
 let state=previous[states-1]>previous[states-2]?states-1:states-2
 if(!Number.isFinite(previous[state]))throw new Error('No alignment path')
 const spans=characters.map(()=>({start:Infinity,end:0}))
 for(let t=frames-1;t>=0;t--){
  if(state%2){const span=spans[(state-1)/2];span.start=t;span.end=Math.max(span.end,t+1)}
  state-=paths[t*states+state]
 }
 const words=[...text.matchAll(/[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu)].map(match=>{
  const indices=characters.flatMap((character,index)=>character.offset>=match.index!&&character.offset<match.index!+match[0].length?[index]:[])
  const first=spans[indices[0]],last=spans[indices.at(-1)!]
  if(!first||!last||!Number.isFinite(first.start))throw new Error('Word not aligned')
  return {text:match[0],start:match.index!,end:match.index!+match[0].length,startTime:first.start/frames*duration,endTime:last.end/frames*duration}
 })
 const timing=parseSentenceTiming({version:1,text,words},text)
 if(!timing)throw new Error('Invalid alignment')
 return timing
}

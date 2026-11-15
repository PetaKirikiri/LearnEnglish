import {expect,it} from 'vitest'
import {timingFromAlignment,parseSentenceTiming,wordAtTime,wordAtCharacter} from './sentenceTiming'

const text="I see Bia’s dog and Bia’s dog."
const alignment={
 characters:[...text],
 character_start_times_seconds:[...text].map((_,index)=>index*.1),
 character_end_times_seconds:[...text].map((_,index)=>(index+1)*.1),
}
it('preserves word offsets, apostrophes, repetitions, punctuation and silent gaps',()=>{
 const timing=timingFromAlignment(text,alignment)!
 expect(timing.words.map(word=>word.text)).toEqual(['I','see','Bia’s','dog','and','Bia’s','dog'])
 const second=timing.words[5]
 expect(wordAtTime(timing,second.startTime)).toEqual({start:second.start,end:second.end})
 expect(wordAtTime(timing,.15)).toBeNull()
 expect(wordAtTime(timing,99)).toBeNull()
 expect(wordAtCharacter(text,second.start)).toEqual({start:second.start,end:second.end})
})
it('rejects stale text, incomplete arrays, negative, reversed and non-finite timings',()=>{
 expect(timingFromAlignment('Other text.',alignment)).toBeNull()
 expect(timingFromAlignment(text,{...alignment,character_start_times_seconds:[0]})).toBeNull()
 for(const invalid of [-1,NaN,Infinity])expect(timingFromAlignment(text,{...alignment,character_end_times_seconds:alignment.character_end_times_seconds.map((time,index)=>index?time:invalid)})).toBeNull()
 expect(parseSentenceTiming({version:1,text,words:[]},text)).toBeNull()
 const timing=timingFromAlignment(text,alignment)!
 expect(parseSentenceTiming({...timing,words:timing.words.map(word=>({...word,start:0}))},text)).toBeNull()
})

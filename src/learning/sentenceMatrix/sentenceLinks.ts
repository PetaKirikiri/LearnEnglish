import type {LanguageRole} from './sentenceRoles'
export type SentenceLink={start:number;end:number;kind:'noun'|'agreement'}
/** Whole phrases stay joined, while each word retains its own icon and colour. */
export function sentenceLinks(units:readonly {role:LanguageRole}[]):SentenceLink[]{
 const links:SentenceLink[]=[],occupied=new Set<number>()
 for(let start=0;start<units.length;start++){
  if(!['determiner','person-determiner'].includes(units[start].role))continue
  const noun=start+(units[start+1]?.role==='description'?2:1)
  if(!['person','object'].includes(units[noun]?.role))continue
  links.push({start,end:noun+1,kind:'noun'})
  for(let i=start;i<=noun;i++)occupied.add(i)
 }
 for(let start=0;start<units.length-1;start++){
  if(occupied.has(start)||occupied.has(start+1))continue
  const [a,b]=[units[start].role,units[start+1].role]
  if((['person','reference'].includes(a)&&b==='be')||(a==='be'&&['person','reference'].includes(b))){
   links.push({start,end:start+2,kind:'agreement'});occupied.add(start);occupied.add(start+1)
  }
 }
 return links.sort((a,b)=>a.start-b.start)
}

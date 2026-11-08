/** Choose from approved questions without over-weighting nouns with many variants.
 * Groups are ordered by priority (noun family, then speaker, then owner).
 * Randomness only breaks equal-coverage ties; it never invents a sentence.
 */
export function diverseQuestions<T>(candidates:readonly T[],count:number,groups:(item:T)=>readonly string[],random:()=>number=Math.random):T[]{
 const remaining=candidates.map(item=>({item,tie:random()}))
 const selected:T[]=[],seen:Map<string,number>[]=[]
 const compare=(a:T,b:T)=>{
  const ga=groups(a),gb=groups(b)
  for(let index=0;index<Math.max(ga.length,gb.length);index++){
   const difference=(seen[index]?.get(ga[index])??0)-(seen[index]?.get(gb[index])??0)
   if(difference)return difference
  }
  return 0
 }
 while(selected.length<count&&remaining.length){
  remaining.sort((a,b)=>compare(a.item,b.item)||a.tie-b.tie)
  const {item}=remaining.shift()!
  selected.push(item)
  groups(item).forEach((group,index)=>{seen[index]??=new Map();seen[index].set(group,(seen[index].get(group)??0)+1)})
 }
 return selected
}

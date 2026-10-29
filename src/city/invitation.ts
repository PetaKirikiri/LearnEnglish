/** Use the LIFF entry so links shared inside LINE enter the configured app. */
export function cityInvitation(origin:string,code:string,liffId?:string){
 const path=`/english/city/controller?room=${encodeURIComponent(code)}`
 const joinUrl=liffId?.trim()?`https://liff.line.me/${liffId.trim()}${path}`:`${origin.replace(/\/$/,'')}${path}`
 const text=`มาเล่น EnglishSuccess City ด้วยกัน!\nJoin our city game\n${joinUrl}`
 return {joinUrl,shareUrl:`https://line.me/R/share?text=${encodeURIComponent(text)}`}
}

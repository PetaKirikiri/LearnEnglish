import type { NounForms, VerbForms } from '../src/learning/wordInfo/types'
// Reviewed lexical families. Membership, not suffix guessing, determines noun/verb roles.
// A word can occur in both lists; sentence context is required to select its role.
const countable = `act afternoon airport answer apartment apple aunt bag beach bed beginner bird birder birthday bit book bottle brother bubble bus call car cat cave center chef child circle city class clock club coal coast coat column cone cook cost country cup day degree diamond diary direction dish doctor dog door drawing dress driver ear elevator end evening exercise family farm father field fish folder food friend game gate glass grandfather grandmother grade group guide handout head hill hobby home hour house island isle jacket jam job kid kind layer leaf lemon letter life light list loop lot man mind minute month morning mother mountain name nest newspaper night notebook ocean officer pancake parent part pattern pen pencil person pet phone photo photograph picture piece pilot place plane plate platform question rider river rock room school seat shape sheep singer sister size slice sound space spice spoonful stair star start station stick storm street student subject suburb suitcase summer sun supply sweater table taxi teacher temperature thing ticket time town track train tree treehouse trip university vegetable video view volcano walk way week weekend wheel wing winter worker world year`.split(' ')
const irregular: Record<string,string> = {child:'children',person:'people',man:'men',life:'lives',leaf:'leaves',sheep:'sheep',fish:'fish',potato:'potatoes',tomato:'tomatoes',photo:'photos',piano:'pianos',volcano:'volcanoes'}
function plural(word:string) { return irregular[word] ?? (/[^aeiou]y$/.test(word) ? word.slice(0,-1)+'ies' : /(?:s|x|z|ch|sh)$/.test(word) ? word+'es' : word+'s') }
export const nouns: NounForms[] = [...countable,'leaf','potato','chip','cob','percent','sidewalk','sky','sleeve','top','turkey'].filter((w,i,a)=>a.indexOf(w)===i).map(singular=>({singular,plural:plural(singular),countability:'countable'}))
for(const singular of `attention audio basketball birdwatching bread breakfast care cheese chili climate clothing corn cream farming fishing food fun ground homework ice introduction meat milk music police rain rice salt sauce skiing snow steel support thunder traffic travel underwear vinegar water weather countryside midnight north wood wool work`.split(' ')) {
 const existing=nouns.find(n=>n.singular===singular)
 if(existing) { existing.countability='both'; existing.note_th='นับได้หรือนับไม่ได้ตามความหมายในประโยค' }
 else nouns.push({singular,plural:null,countability:'uncountable'})
}
nouns.find(n=>n.singular==='police')!.countability='plural-only'
nouns.find(n=>n.singular==='police')!.note_th='ใช้กับ are; ตำรวจหนึ่งนายใช้ a police officer'
nouns.find(n=>n.singular==='wood')!.plural='woods'
nouns.find(n=>n.singular==='wood')!.countability='both'
nouns.find(n=>n.singular==='wood')!.note_th='wood เป็นวัสดุไม้นับไม่ได้; woods หมายถึงป่า เป็นอีกความหมายหนึ่ง'
for(const word of ['glass','room','rock','time','light','space','chicken']) { const n=nouns.find(n=>n.singular===word);if(n){n.countability='both';n.note_th='นับได้หรือนับไม่ได้ตามความหมายในประโยค'} }
const regular=`act answer ask build call care carry clap climb close collect color cook cool cost cover crumble draw dress drop dry eat end erupt exercise farm feed fish fly free fry get give go guide hear help hike hug hurt jam join keep know learn leave like listen live look lose love make mean mind move name need open pass pick play prepare put rain raise reach remember ride rise roast run save see sell send serve set shape shine shoot shout show sing sit ski sleep sound spend spice spit spread stack start stay stick stop study supply support sweep swim take talk tell thank think track train travel treat try visit wait wake walk want warm watch wear win work write`.split(' ')
const irregularVerbs:Record<string,[string,string]>={be:['was / were','been'],have:['had','had'],do:['did','done'],build:['built','built'],buy:['bought','bought'],catch:['caught','caught'],come:['came','come'],cost:['cost','cost'],draw:['drew','drawn'],drink:['drank','drunk'],drive:['drove','driven'],eat:['ate','eaten'],feed:['fed','fed'],find:['found','found'],fly:['flew','flown'],get:['got','got / gotten'],give:['gave','given'],go:['went','gone'],hear:['heard','heard'],hold:['held','held'],hurt:['hurt','hurt'],keep:['kept','kept'],know:['knew','known'],leave:['left','left'],lose:['lost','lost'],make:['made','made'],mean:['meant','meant'],put:['put','put'],read:['read','read'],ride:['rode','ridden'],rise:['rose','risen'],run:['ran','run'],say:['said','said'],see:['saw','seen'],sell:['sold','sold'],send:['sent','sent'],set:['set','set'],shine:['shone','shone'],shoot:['shot','shot'],show:['showed','shown'],sing:['sang','sung'],sit:['sat','sat'],sleep:['slept','slept'],spend:['spent','spent'],spit:['spat','spat'],spread:['spread','spread'],stick:['stuck','stuck'],sweep:['swept','swept'],swim:['swam','swum'],take:['took','taken'],tell:['told','told'],think:['thought','thought'],wake:['woke','woken'],wear:['wore','worn'],win:['won','won'],write:['wrote','written']}
const double = new Set('clap drop get hug put run set sit spit stop swim win'.split(' '))
export const verbs:VerbForms[] = [...new Set([...regular,...Object.keys(irregularVerbs)])].map(base=>{
 const stem=double.has(base)?base+base.at(-1):base
 const past=irregularVerbs[base]?.[0] ?? (base.endsWith('e')?base+'d':/[^aeiou]y$/.test(base)?base.slice(0,-1)+'ied':stem+'ed')
 return {base,third:base==='be'?'is':base==='have'?'has':/[^aeiou]y$/.test(base)?base.slice(0,-1)+'ies':/(?:s|x|z|ch|sh|o)$/.test(base)?base+'es':base+'s',past,participle:irregularVerbs[base]?.[1]??past,ing:base==='be'?'being':base.endsWith('ie')?base.slice(0,-2)+'ying':base.endsWith('e')&&!base.endsWith('ee')?base.slice(0,-1)+'ing':stem+'ing'}
})
export function nounMatches(n:NounForms, word:string) { return n.singular===word || n.plural===word || word===n.singular+"'s" || word===n.plural+"'s" }
export function verbMatches(v:VerbForms,word:string) { return Object.values(v).some(value=>value.split(' / ').includes(word)) || (v.base==='be'&&['am','are','was','were'].includes(word)) }

export const grammarNotes:Record<string,string>={
 can:'กริยาช่วยบอกความสามารถหรือความเป็นไปได้ ตามด้วยกริยารูปพื้นฐาน ไม่เติม -s',
 cannot:'รูปปฏิเสธของ can ใช้บอกว่าทำไม่ได้ ตามด้วยกริยารูปพื้นฐาน',
 "can't":'ย่อจาก cannot ใช้บอกว่าทำไม่ได้ ตามด้วยกริยารูปพื้นฐาน',
 could:'กริยาช่วย ใช้บอกความสามารถในอดีต ความเป็นไปได้ หรือขอร้องอย่างสุภาพ จึงไม่ได้บอกอดีตทุกครั้ง',
 will:'กริยาช่วย มักบอกอนาคตหรือความตั้งใจ ตามด้วยกริยารูปพื้นฐาน',
 would:'กริยาช่วย ใช้กับเหตุการณ์สมมติ ความเคยชินในอดีต หรือคำขออย่างสุภาพ ต้องดูบริบท',
 "don't":'ย่อจาก do not ใช้ปฏิเสธในปัจจุบัน ตามด้วยกริยารูปพื้นฐาน',
 "doesn't":'ย่อจาก does not ใช้กับ he / she / it หรือประธานเอกพจน์ในปัจจุบัน กริยาที่ตามมาไม่เติม -s',
 "didn't":'ย่อจาก did not ใช้ปฏิเสธในอดีต กริยาที่ตามมาต้องเป็นรูปพื้นฐาน',
 "i'm":'ย่อจาก I am เป็นกริยา be รูปปัจจุบันที่ใช้กับ I',
 "we're":'ย่อจาก we are เป็นกริยา be รูปปัจจุบันที่ใช้กับ we',
 "it's":'ย่อจาก it is หรือ it has ต้องดูคำที่ตามมา ต่างจาก its ที่แสดงความเป็นเจ้าของ',
 "she's":'ย่อจาก she is หรือ she has ต้องดูคำที่ตามมา',
 "that's":'ย่อจาก that is หรือ that has ต้องดูคำที่ตามมา',
 "there's":'ย่อจาก there is หรือ there has ต้องดูคำที่ตามมา',
}

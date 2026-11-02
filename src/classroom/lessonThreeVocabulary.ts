import type { VocabularyCategory } from '../learning/sentenceMatrix/vocabularyCategories'
/** New concrete nouns for Lesson 3. Earlier lesson words are merged separately. */
export const lessonThreeWords:readonly {indefiniteArticle?:'a'|'an';classifierThai?:string;singular:string;plural:string;thai:string;categories:readonly VocabularyCategory[]}[] = [
 {indefiniteArticle:'an',classifierThai:'ลูก',singular:'apple',plural:'apples',thai:'แอปเปิล',categories:['food']},
 {indefiniteArticle:'a',classifierThai:'ลูก',singular:'banana',plural:'bananas',thai:'กล้วย',categories:['food']},
 {indefiniteArticle:'an',classifierThai:'ลูก',singular:'orange',plural:'oranges',thai:'ส้ม',categories:['food']},
 {indefiniteArticle:'a',classifierThai:'ชิ้น',singular:'sandwich',plural:'sandwiches',thai:'แซนด์วิช',categories:['food']},
 {singular:'umbrella',plural:'umbrellas',thai:'ร่ม',categories:['everyday']},
 {singular:'wallet',plural:'wallets',thai:'กระเป๋าสตางค์',categories:['everyday']},
 {singular:'passport',plural:'passports',thai:'หนังสือเดินทาง',categories:['everyday']},
 {singular:'laptop',plural:'laptops',thai:'แล็ปท็อป',categories:['everyday']},
 {singular:'camera',plural:'cameras',thai:'กล้อง',categories:['everyday']},
 {singular:'bicycle',plural:'bicycles',thai:'จักรยาน',categories:['transport','sports']},
 {singular:'bus',plural:'buses',thai:'รถบัส',categories:['transport']},
 {singular:'restaurant',plural:'restaurants',thai:'ร้านอาหาร',categories:['places','buildings']},
]

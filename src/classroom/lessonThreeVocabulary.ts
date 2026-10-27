import type { VocabularyCategory } from '../learning/sentenceMatrix/vocabularyCategories'
/** New concrete nouns for Lesson 3. Earlier lesson words are merged separately. */
export const lessonThreeWords:readonly {singular:string;plural:string;thai:string;categories:readonly VocabularyCategory[]}[] = [
 {singular:'apple',plural:'apples',thai:'แอปเปิล',categories:['food']},
 {singular:'banana',plural:'bananas',thai:'กล้วย',categories:['food']},
 {singular:'orange',plural:'oranges',thai:'ส้ม',categories:['food']},
 {singular:'sandwich',plural:'sandwiches',thai:'แซนด์วิช',categories:['food']},
 {singular:'umbrella',plural:'umbrellas',thai:'ร่ม',categories:['everyday']},
 {singular:'wallet',plural:'wallets',thai:'กระเป๋าสตางค์',categories:['everyday']},
 {singular:'passport',plural:'passports',thai:'หนังสือเดินทาง',categories:['everyday']},
 {singular:'laptop',plural:'laptops',thai:'แล็ปท็อป',categories:['everyday']},
 {singular:'camera',plural:'cameras',thai:'กล้อง',categories:['everyday']},
 {singular:'bicycle',plural:'bicycles',thai:'จักรยาน',categories:['transport','sports']},
 {singular:'bus',plural:'buses',thai:'รถบัส',categories:['transport']},
 {singular:'restaurant',plural:'restaurants',thai:'ร้านอาหาร',categories:['places','buildings']},
]

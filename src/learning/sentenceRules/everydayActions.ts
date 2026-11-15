import type {Action} from './actionDialogue'
import {actionArtwork as icon} from './actionArtwork'
/** New uses fit the existing direct-object and to-destination constructions. */
export const everydayActions=[
 {word:'cooking',thai:'ปรุง',thaiByObject:{rice:'หุง'},complement:'object',objects:['cookable'],categories:['food'],icon:icon('cooking')},
 {word:'taking',thai:'หยิบ',complement:'object',objects:['carryable'],categories:['everyday'],icon:icon('taking')},
 {word:'bringing',thai:'นำมา',complement:'object',objects:['carryable'],categories:['everyday'],icon:icon('bringing')},
 {word:'choosing',thai:'เลือก',complement:'object',objects:['purchasable'],categories:['everyday'],icon:icon('choosing')},
 {word:'cutting',thai:'หั่น',complement:'object',objects:['cuttable'],categories:['food'],icon:icon('cutting')},
 {word:'drawing',thai:'วาด',complement:'object',objects:['depictable','person'],categories:['everyday'],icon:icon('drawing')},
 {word:'painting',thai:'ทาสี',complement:'object',objects:['paintable'],categories:['everyday'],icon:icon('painting')},
 {word:'fixing',thai:'ซ่อม',complement:'object',objects:['repairable'],categories:['everyday'],icon:icon('fixing')},
 {word:'pushing',thai:'ผลัก',complement:'object',objects:['pushable'],categories:['everyday'],icon:icon('pushing')},
 {word:'pulling',thai:'ดึง',complement:'object',objects:['pullable'],categories:['everyday'],icon:icon('pulling')},
 {word:'lifting',thai:'ยก',complement:'object',objects:['liftable'],categories:['everyday'],icon:icon('lifting')},
 {word:'selling',thai:'ขาย',complement:'object',objects:['purchasable'],categories:['everyday'],icon:icon('selling')},
 {word:'visiting',thai:'เยี่ยม',thaiByObject:{school:'แวะไปที่',clinic:'แวะไปที่',hotel:'แวะไปที่',bank:'แวะไปที่',bookstore:'แวะไปที่',gym:'แวะไปที่',restaurant:'แวะไปที่',home:'ไปเยี่ยม'},complement:'object',objects:['visitable','person'],categories:['people','places'],icon:icon('visiting')},
 {word:'coming',thai:'มา',destination:true,complement:'destination',objects:['destination','person'],uses:{to:{objects:['destination','person']}},categories:['places'],icon:icon('coming')},
] as const satisfies readonly Action[]

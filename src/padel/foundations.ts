import type { PadelPair } from './content'

// Short bridges before service language. Grammar alternatives keep the action
// and equipment stable: recognising "racket" cannot answer "my / your".
export const foundationPairs: readonly PadelPair[] = [
  ['foundation-balls','quantity',['One ball.','Two balls.'],['ลูกบอลหนึ่งลูก','ลูกบอลสองลูก']],
  ['foundation-players','quantity',['One player.','Two players.'],['ผู้เล่นหนึ่งคน','ผู้เล่นสองคน']],
  ['foundation-owner-racket','possession',['My racket.','Your racket.'],['ไม้พาเดลของฉัน','ไม้พาเดลของคุณ']],
  ['foundation-owner-ball','possession',['My ball.','Your ball.'],['ลูกบอลของฉัน','ลูกบอลของคุณ']],
  ['foundation-owner-court','possession',['My court.','Your court.'],['สนามของฉัน','สนามของคุณ']],
  ['foundation-playing','ongoing',['I am playing.','You are playing.'],['ฉันกำลังเล่น','คุณกำลังเล่น']],
  ['foundation-waiting','ongoing',['I am waiting.','You are waiting.'],['ฉันกำลังรอ','คุณกำลังรอ']],
  ['foundation-we-playing','ongoing',['I am playing.','We are playing.'],['ฉันกำลังเล่น','พวกเรากำลังเล่น']],
  ['foundation-not-playing','permission',['I am playing.','I am not playing.'],['ฉันกำลังเล่น','ฉันไม่ได้กำลังเล่น']],
  ['foundation-not-waiting','permission',['I am waiting.','I am not waiting.'],['ฉันกำลังรอ','ฉันไม่ได้กำลังรอ']],
  ['foundation-player-location','position',['The player is here.','The player is there.'],['ผู้เล่นอยู่ที่นี่','ผู้เล่นอยู่ที่นั่น']],
  ['foundation-coach-location','position',['The coach is here.','The coach is there.'],['โค้ชอยู่ที่นี่','โค้ชอยู่ที่นั่น']],
  ['foundation-court-location','position',['The court is on your left.','The court is on your right.'],['สนามอยู่ทางซ้ายของคุณ','สนามอยู่ทางขวาของคุณ']],
]

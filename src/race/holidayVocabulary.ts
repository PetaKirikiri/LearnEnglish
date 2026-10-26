// One vocabulary source for the lesson notes and both holiday race activities.
export const holidayVocabulary = [
  { word: 'taxi', thai: 'รถแท็กซี่', meaningDistractor: 'รถแท็กซี่ราคาเท่าไหร่' },
  { word: 'hotel', thai: 'โรงแรม', meaningDistractor: 'โรงแรมราคาเท่าไหร่' },
  { word: 'toilet', thai: 'ห้องน้ำ', meaningDistractor: 'ห้องน้ำเปิดกี่โมง' },
  { word: 'restaurant', thai: 'ร้านอาหาร', meaningDistractor: 'ร้านอาหารเปิดกี่โมง' },
  { word: 'beach', thai: 'ชายหาด', meaningDistractor: 'ชายหาดชื่ออะไร' },
  { word: 'airport', thai: 'สนามบิน', meaningDistractor: 'สนามบินชื่ออะไร' },
  { word: 'shop', thai: 'ร้านค้า', meaningDistractor: 'ร้านค้าเปิดกี่โมง' },
  { word: 'ATM', thai: 'ตู้เอทีเอ็ม', meaningDistractor: 'ใช้ตู้เอทีเอ็มอย่างไร' },
  { word: 'bank', thai: 'ธนาคาร', meaningDistractor: 'ธนาคารเปิดกี่โมง' },
  { word: 'pharmacy', thai: 'ร้านขายยา', meaningDistractor: 'ร้านขายยาปิดกี่โมง' },
  { word: 'hospital', thai: 'โรงพยาบาล', meaningDistractor: 'โรงพยาบาลชื่ออะไร' },
  { word: 'supermarket', thai: 'ซูเปอร์มาร์เก็ต', meaningDistractor: 'ซูเปอร์มาร์เก็ตปิดกี่โมง' },
  { word: 'market', thai: 'ตลาด', meaningDistractor: 'ตลาดเปิดกี่โมง' },
  { word: 'cafe', thai: 'คาเฟ่', meaningDistractor: 'คาเฟ่ชื่ออะไร' },
  { word: 'bus stop', thai: 'ป้ายรถเมล์', meaningDistractor: 'ป้ายรถเมล์ชื่ออะไร' },
  { word: 'car park', thai: 'ที่จอดรถ', meaningDistractor: 'ที่จอดรถราคาเท่าไหร่' },
  { word: 'entrance', thai: 'ทางเข้า', meaningDistractor: 'ทางเข้ามีกี่ทาง' },
  { word: 'exit', thai: 'ทางออก', meaningDistractor: 'ทางออกมีกี่ทาง' },
  { word: 'lift', thai: 'ลิฟต์', meaningDistractor: 'ลิฟต์รับได้กี่คน' },
  { word: 'swimming pool', thai: 'สระว่ายน้ำ', meaningDistractor: 'สระว่ายน้ำปิดกี่โมง' },
] as const
export type HolidayWord = typeof holidayVocabulary[number]['word']

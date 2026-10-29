export const tonightWords = [
  ['hotel', 'โรงแรม'], ['toilet', 'ห้องน้ำ'], ['gym', 'ยิม'], ['padel court', 'สนามพาเดล'],
  ['racket', 'ไม้แร็กเกต'], ['phone', 'โทรศัพท์'], ['air conditioner', 'เครื่องปรับอากาศ'], ['fan', 'พัดลม'],
  ['remote', 'รีโมต'], ['doctor', 'หมอ'], ['clinic', 'คลินิก'], ['school', 'โรงเรียน'],
  ['motorbike', 'รถมอเตอร์ไซค์'], ['table', 'โต๊ะ'], ['chair', 'เก้าอี้'], ['bank', 'ธนาคาร'],
  ['bookstore', 'ร้านหนังสือ'], ['watch', 'นาฬิกาข้อมือ'], ['clock', 'นาฬิกา'], ['bedroom', 'ห้องนอน'],
] as const

/** Authored counterparts; no automatic suffix guessing for classroom agreement. */
export const tonightPluralForms: Record<typeof tonightWords[number][0], string> = {
 hotel:'hotels', toilet:'toilets', gym:'gyms', 'padel court':'padel courts',
 racket:'rackets', phone:'phones', 'air conditioner':'air conditioners', fan:'fans',
 remote:'remotes', doctor:'doctors', clinic:'clinics', school:'schools',
 motorbike:'motorbikes', table:'tables', chair:'chairs', bank:'banks',
 bookstore:'bookstores', watch:'watches', clock:'clocks', bedroom:'bedrooms',
}

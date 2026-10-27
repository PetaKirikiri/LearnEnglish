// Ordinary count nouns first; pair nouns are taught separately, never glass → glasses.
export const pluralVocabulary = [
  { singular: 'shoe', group: 'wear', classifier: 'ข้าง', plural: 'shoes', thai: 'รองเท้า' },
  { singular: 'key', group: 'carry', classifier: 'ดอก', plural: 'keys', thai: 'กุญแจ' },
  { singular: 'sock', group: 'wear', classifier: 'ข้าง', plural: 'socks', thai: 'ถุงเท้า' },
  { singular: 'bag', group: 'carry', classifier: 'ใบ', plural: 'bags', thai: 'กระเป๋า' },
  { singular: 'ticket', group: 'carry', classifier: 'ใบ', plural: 'tickets', thai: 'ตั๋ว' },
  { singular: 'book', group: 'carry', classifier: 'เล่ม', plural: 'books', thai: 'หนังสือ' },
  { singular: 'sandal', group: 'wear', classifier: 'ข้าง', plural: 'sandals', thai: 'รองเท้าแตะ' },
  { singular: 'boot', group: 'wear', classifier: 'ข้าง', plural: 'boots', thai: 'รองเท้าบูต' },
  { singular: 'shirt', group: 'wear', classifier: 'ตัว', plural: 'shirts', thai: 'เสื้อเชิ้ต' },
  { singular: 'hat', group: 'wear', classifier: 'ใบ', plural: 'hats', thai: 'หมวก' },
  { singular: 'pen', group: 'carry', classifier: 'ด้าม', plural: 'pens', thai: 'ปากกา' },
  { singular: 'pencil', group: 'carry', classifier: 'แท่ง', plural: 'pencils', thai: 'ดินสอ' },
  { singular: 'phone', group: 'around', classifier: 'เครื่อง', plural: 'phones', thai: 'โทรศัพท์' },
  { singular: 'charger', group: 'around', classifier: 'อัน', plural: 'chargers', thai: 'ที่ชาร์จ' },
  { singular: 'towel', group: 'around', classifier: 'ผืน', plural: 'towels', thai: 'ผ้าขนหนู' },
  { singular: 'bottle', group: 'around', classifier: 'ขวด', plural: 'bottles', thai: 'ขวด' },
  { singular: 'cup', group: 'around', classifier: 'ใบ', plural: 'cups', thai: 'ถ้วย' },
  { singular: 'plate', group: 'around', classifier: 'ใบ', plural: 'plates', thai: 'จาน' },
] as const
export const pairVocabulary = [
  { plural: 'glasses', thai: 'แว่นตา' },
  { plural: 'trousers', thai: 'กางเกงขายาว' },
] as const

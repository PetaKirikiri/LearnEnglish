import type { HotelPair } from './expandedContent'

// Fictional training situations, not policies or opening hours for a real hotel.
// Append-only: these pairs start at hotel-225; keep existing IDs stable.
export const hotelRoutinePairs: readonly HotelPair[] = [
  ['facilities', ['The pool.', 'The gym.'], ['สระว่ายน้ำ', 'ห้องออกกำลังกาย']],
  ['facilities', ['The pool is on the second floor.', 'The gym is on the second floor.'], ['สระว่ายน้ำอยู่ชั้นสอง', 'ห้องออกกำลังกายอยู่ชั้นสอง']],
  ['facilities', ['The sauna.', 'The spa.'], ['ห้องซาวน่า', 'สปา']],
  ['facilities', ['The sauna is next to the pool.', 'The spa is next to the pool.'], ['ห้องซาวน่าอยู่ข้างสระว่ายน้ำ', 'สปาอยู่ข้างสระว่ายน้ำ']],
  ['facilities', ['On the ground floor.', 'On the top floor.'], ['ที่ชั้นล่างสุด', 'ที่ชั้นบนสุด']],
  ['facilities', ['The restaurant is on the ground floor.', 'The restaurant is on the top floor.'], ['ห้องอาหารอยู่ชั้นล่างสุด', 'ห้องอาหารอยู่ชั้นบนสุด']],
  ['facilities', ['The toilets are beside the lift.', 'The toilets are opposite the lift.'], ['ห้องน้ำอยู่ข้างลิฟต์', 'ห้องน้ำอยู่ตรงข้ามลิฟต์']],
  ['facilities', ['You can get pool towels at reception.', 'You can get pool towels by the pool.'], ['คุณรับผ้าขนหนูสำหรับใช้ที่สระได้ที่แผนกต้อนรับ', 'คุณรับผ้าขนหนูสำหรับใช้ที่สระได้ที่ริมสระว่ายน้ำ']],

  ['hours', ['The pool is open.', 'The pool is closed.'], ['สระว่ายน้ำเปิดอยู่', 'สระว่ายน้ำปิดอยู่']],
  ['hours', ['The pool opens at seven in the morning.', 'The pool closes at seven in the evening.'], ['สระว่ายน้ำเปิดตอนเจ็ดโมงเช้า', 'สระว่ายน้ำปิดตอนหนึ่งทุ่ม']],
  ['hours', ['The gym opens at six in the morning.', 'The gym closes at ten at night.'], ['ห้องออกกำลังกายเปิดตอนหกโมงเช้า', 'ห้องออกกำลังกายปิดตอนสี่ทุ่ม']],
  ['hours', ['The sauna is open until nine tonight.', 'The sauna is closed until nine tomorrow morning.'], ['ห้องซาวน่าเปิดให้ใช้ถึงสามทุ่มคืนนี้', 'ห้องซาวน่าจะปิดอยู่จนถึงเก้าโมงเช้าพรุ่งนี้']],
  ['hours', ['Breakfast starts at six thirty.', 'Breakfast finishes at ten thirty.'], ['อาหารเช้าเริ่มให้บริการตอนหกโมงครึ่ง', 'อาหารเช้าสิ้นสุดการให้บริการตอนสิบโมงครึ่ง']],
  ['hours', ['Breakfast is served from seven to ten.', 'Dinner is served from six to nine.'], ['อาหารเช้าให้บริการตั้งแต่เจ็ดโมงถึงสิบโมง', 'อาหารเย็นให้บริการตั้งแต่หกโมงเย็นถึงสามทุ่ม']],
  ['hours', ['The pool is open every day.', 'The pool is closed on Mondays.'], ['สระว่ายน้ำเปิดทุกวัน', 'สระว่ายน้ำปิดทุกวันจันทร์']],
  ['hours', ['The gym is open all night.', 'The gym is closed at night.'], ['ห้องออกกำลังกายเปิดตลอดคืน', 'ห้องออกกำลังกายปิดตอนกลางคืน']],

  ['stay_times', ['An early check-in.', 'A late checkout.'], ['การเช็กอินก่อนเวลา', 'การเช็กเอาต์เกินเวลาปกติ']],
  ['stay_times', ['Would you like an early check-in?', 'Would you like a late checkout?'], ['คุณต้องการเช็กอินก่อนเวลาไหม', 'คุณต้องการเช็กเอาต์เกินเวลาปกติไหม']],
  ['stay_times', ['You can check in from two in the afternoon.', 'Please check out by eleven in the morning.'], ['คุณเช็กอินได้ตั้งแต่บ่ายสองโมง', 'กรุณาเช็กเอาต์ไม่เกินสิบเอ็ดโมงเช้า']],
  ['stay_times', ['Your room will be ready before two.', 'Your room will be ready after two.'], ['ห้องของคุณจะพร้อมก่อนบ่ายสองโมง', 'ห้องของคุณจะพร้อมหลังบ่ายสองโมง']],
  ['stay_times', ['You can check in early today.', 'You cannot check in early today.'], ['วันนี้คุณเช็กอินก่อนเวลาได้', 'วันนี้คุณเช็กอินก่อนเวลาไม่ได้']],
  ['stay_times', ['You can keep the room until two.', 'You need to leave the room by two.'], ['คุณใช้ห้องต่อได้ถึงบ่ายสองโมง', 'คุณต้องออกจากห้องไม่เกินบ่ายสองโมง']],
  ['stay_times', ['There is an extra charge for late checkout.', 'There is no extra charge for late checkout.'], ['การเช็กเอาต์เกินเวลามีค่าใช้จ่ายเพิ่มเติม', 'การเช็กเอาต์เกินเวลาไม่มีค่าใช้จ่ายเพิ่มเติม']],
  ['stay_times', ['I will check if early check-in is available.', 'I will check if late checkout is available.'], ['ฉันจะตรวจสอบให้ว่าเช็กอินก่อนเวลาได้ไหม', 'ฉันจะตรวจสอบให้ว่าเช็กเอาต์เกินเวลาได้ไหม']],

  ['wake_up', ['A wake-up call.', 'A taxi booking.'], ['บริการโทรปลุก', 'การจองแท็กซี่']],
  ['wake_up', ['Would you like a wake-up call?', 'Would you like a taxi booking?'], ['คุณต้องการให้โทรปลุกไหม', 'คุณต้องการจองแท็กซี่ไหม']],
  ['wake_up', ['What time would you like your wake-up call?', 'What time would you like your airport transfer?'], ['คุณต้องการให้โทรปลุกกี่โมง', 'คุณต้องการรถไปส่งสนามบินกี่โมง']],
  ['wake_up', ['Would you like us to call at six?', 'Would you like us to call at six thirty?'], ['คุณต้องการให้เราโทรตอนหกโมงไหม', 'คุณต้องการให้เราโทรตอนหกโมงครึ่งไหม']],
  ['wake_up', ['We will call your room.', 'We will call your mobile.'], ['เราจะโทรไปที่ห้องของคุณ', 'เราจะโทรเข้าโทรศัพท์มือถือของคุณ']],
  ['wake_up', ['Your wake-up call is set for tomorrow morning.', 'Your wake-up call is set for every morning.'], ['เราตั้งเวลาโทรปลุกคุณสำหรับพรุ่งนี้เช้าแล้ว', 'เราตั้งเวลาโทรปลุกคุณสำหรับทุกเช้าแล้ว']],
  ['wake_up', ['Would you like to change your wake-up call?', 'Would you like to cancel your wake-up call?'], ['คุณต้องการเปลี่ยนเวลาโทรปลุกไหม', 'คุณต้องการยกเลิกบริการโทรปลุกไหม']],
  ['wake_up', ['Good morning. This is your wake-up call.', 'Good morning. Your taxi is waiting.'], ['สวัสดีตอนเช้า นี่คือบริการโทรปลุกของคุณ', 'สวัสดีตอนเช้า แท็กซี่ของคุณกำลังรออยู่']],

  ['arrivals', ['Are you arriving today?', 'Are you departing today?'], ['คุณจะมาถึงวันนี้ใช่ไหม', 'คุณจะออกเดินทางวันนี้ใช่ไหม']],
  ['arrivals', ['What time will you arrive?', 'What time will you leave?'], ['คุณจะมาถึงกี่โมง', 'คุณจะออกเดินทางกี่โมง']],
  ['arrivals', ['Will you arrive before midnight?', 'Will you arrive after midnight?'], ['คุณจะมาถึงก่อนเที่ยงคืนใช่ไหม', 'คุณจะมาถึงหลังเที่ยงคืนใช่ไหม']],
  ['arrivals', ['Your flight is early.', 'Your flight is late.'], ['เที่ยวบินของคุณมาก่อนเวลา', 'เที่ยวบินของคุณล่าช้า']],
  ['arrivals', ['Please let us know if you will arrive late.', 'Please let us know if you will leave early.'], ['หากคุณจะมาถึงช้า กรุณาแจ้งเรา', 'หากคุณจะออกเดินทางก่อนเวลา กรุณาแจ้งเรา']],
  ['arrivals', ['The driver will meet you at the airport.', 'The driver will meet you at the hotel.'], ['คนขับรถจะรอพบคุณที่สนามบิน', 'คนขับรถจะรอพบคุณที่โรงแรม']],
  ['arrivals', ['The airport is thirty minutes away.', 'The airport is an hour away.'], ['ใช้เวลาเดินทางไปสนามบินสามสิบนาที', 'ใช้เวลาเดินทางไปสนามบินหนึ่งชั่วโมง']],
  ['arrivals', ['Would you like a taxi before breakfast?', 'Would you like a taxi after breakfast?'], ['คุณต้องการแท็กซี่ก่อนอาหารเช้าไหม', 'คุณต้องการแท็กซี่หลังอาหารเช้าไหม']],

  ['rules', ['Smoking is allowed here.', 'Smoking is not allowed here.'], ['อนุญาตให้สูบบุหรี่ที่นี่', 'ไม่อนุญาตให้สูบบุหรี่ที่นี่']],
  ['rules', ['Please use the smoking area outside.', 'Please do not smoke in your room.'], ['กรุณาใช้พื้นที่สูบบุหรี่ด้านนอก', 'กรุณาอย่าสูบบุหรี่ในห้องพัก']],
  ['rules', ['Please shower before using the pool.', 'Please shower after using the pool.'], ['กรุณาอาบน้ำก่อนใช้สระว่ายน้ำ', 'กรุณาอาบน้ำหลังใช้สระว่ายน้ำ']],
  ['rules', ['Children must stay with an adult by the pool.', 'Children must stay with an adult in the gym.'], ['เด็กต้องอยู่กับผู้ใหญ่บริเวณสระว่ายน้ำ', 'เด็กต้องอยู่กับผู้ใหญ่ในห้องออกกำลังกาย']],
  ['rules', ['Please do not bring glass bottles to the pool.', 'Please do not bring food into the sauna.'], ['กรุณาอย่านำขวดแก้วมาที่สระว่ายน้ำ', 'กรุณาอย่านำอาหารเข้าไปในห้องซาวน่า']],
  ['rules', ['Please keep the noise down after ten at night.', 'Please keep the door closed after ten at night.'], ['กรุณาลดเสียงหลังสี่ทุ่ม', 'กรุณาปิดประตูไว้หลังสี่ทุ่ม']],
  ['rules', ['You need to book the sauna in advance.', 'You do not need to book the sauna in advance.'], ['คุณต้องจองห้องซาวน่าล่วงหน้า', 'คุณไม่ต้องจองห้องซาวน่าล่วงหน้า']],
  ['rules', ['Please return your key at checkout.', 'Please return your pool towel before you leave.'], ['กรุณาคืนกุญแจเมื่อเช็กเอาต์', 'กรุณาคืนผ้าขนหนูสระว่ายน้ำก่อนออกไป']],
]

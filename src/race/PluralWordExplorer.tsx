import VocabularyPicture from '../learning/VocabularyPicture'
import { useState } from 'react'
import ExampleLanguage from '../learning/ExampleLanguage'
import { pluralVocabulary } from './pluralVocabulary'

export default function PluralWordExplorer() {
  const [selected, setSelected] = useState(0)
  const [owner, setOwner] = useState<'the' | 'my' | 'your'>('my')
  const item = pluralVocabulary[selected]
  const meaning = owner === 'the' ? '' : owner === 'my' ? 'ของฉัน' : 'ของคุณ'
  const ownerGloss = owner === 'the' ? 'ที่กำลังพูดถึง' : meaning
  const groups = [{ id: 'wear', label: 'เสื้อผ้าและรองเท้า' }, { id: 'carry', label: 'ของที่พกติดตัว' }, { id: 'around', label: 'ของรอบตัว' }] as const
  return <div contentEditable={false}>
    <div className="rl-vocabulary" aria-label="หมวดคำศัพท์">{groups.map(group => <button key={group.id} aria-pressed={item.group === group.id} onClick={() => setSelected(pluralVocabulary.findIndex(word => word.group === group.id))}><span>{group.label}</span></button>)}</div>
    <div className="rl-vocabulary" aria-label="เลือกคำ">{pluralVocabulary.map((word, index) => ({word,index})).filter(({word}) => word.group === item.group).map(({word: item,index}) => <button key={item.plural} aria-pressed={selected === index} onClick={() => setSelected(index)}><VocabularyPicture word={item.plural}/><span>{item.plural}</span><span>{item.thai}</span><i aria-hidden="true">{selected === index ? '✓' : '+'}</i></button>)}</div>
    <div className="rl-vocabulary" aria-label="เจ้าของ">{(['the', 'my', 'your'] as const).map(value => <button key={value} aria-pressed={owner === value} onClick={() => setOwner(value)}><span>{value}</span><span>{value === 'the' ? 'ที่กำลังพูดถึง' : value === 'my' ? 'ของฉัน' : 'ของคุณ'}</span></button>)}</div>
    <div className="rl-number-comparison">{[false, true].map(plural => {
      const noun = plural ? item.plural : item.singular, verb = plural ? 'are' : 'is'
      return <div key={verb} data-lesson-layout={plural ? 'star' : 'soft'}>
        <div className="rl-number-picture" aria-label={plural ? 'หลายสิ่ง' : 'สิ่งเดียว'}><VocabularyPicture word={noun} count={plural ? 3 : 1}/></div>
        <ExampleLanguage matrix english={`Where **${verb}** ${owner} **${noun}?**`} thai={`${item.thai}${plural ? `หลาย${item.classifier}` : `หนึ่ง${item.classifier}`}${meaning}อยู่ที่ไหน`} units={[{english:'Where',thai:'ที่ไหน'}, {english:verb,thai:'อยู่'}, {english:owner,thai:ownerGloss}, {english:`${noun}?`,thai:item.thai}]}/>
      </div>
    })}</div>
  </div>
}

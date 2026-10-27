import VocabularyPicture from '../VocabularyPicture'
import { useLocationMatrix } from './useLocationMatrix'
import { locationSentence, type ClassroomWord } from './model'
import ExampleLanguage from './ExampleView'
import { pluralVocabulary } from '../../race/pluralVocabulary'

const vocabulary: readonly ClassroomWord[] = pluralVocabulary.flatMap(item=>[{word:item.singular,thai:item.thai,singular:item.singular,plural:item.plural,number:'singular' as const},{word:item.plural,thai:item.thai,singular:item.singular,plural:item.plural,number:'plural' as const}])
export default function PluralWordExplorer() {
  const {word,chooseWord,owner,chooseOwner:setOwner} = useLocationMatrix({id:'plural-explorer',initialOwner:'my',vocabulary,plural:true,initialWord:pluralVocabulary[0].plural})
  const selected = pluralVocabulary.findIndex(item=>item.plural===word || item.singular===word)
  const setSelected = (index:number) => chooseWord(pluralVocabulary[index].plural)
  const item = pluralVocabulary[selected]
  const groups = [{ id: 'wear', label: 'เสื้อผ้าและรองเท้า' }, { id: 'carry', label: 'ของที่พกติดตัว' }, { id: 'around', label: 'ของรอบตัว' }] as const
  return <div contentEditable={false}>
    <div className="rl-vocabulary" aria-label="หมวดคำศัพท์">{groups.map(group => <button key={group.id} aria-pressed={item.group === group.id} onClick={() => setSelected(pluralVocabulary.findIndex(word => word.group === group.id))}><span>{group.label}</span></button>)}</div>
    <div className="rl-vocabulary" aria-label="เลือกคำ">{pluralVocabulary.map((word, index) => ({word,index})).filter(({word}) => word.group === item.group).map(({word: item,index}) => <button key={item.plural} aria-pressed={selected === index} onClick={() => setSelected(index)}><VocabularyPicture word={item.plural}/><span>{item.plural}</span><span>{item.thai}</span><i aria-hidden="true">{selected === index ? '✓' : '+'}</i></button>)}</div>
    <div className="rl-vocabulary" aria-label="เจ้าของ">{(['the', 'my', 'your'] as const).map(value => <button key={value} aria-pressed={owner === value} onClick={() => setOwner(value)}><span>{value}</span><span>{value === 'the' ? 'ที่กำลังพูดถึง' : value === 'my' ? 'ของฉัน' : 'ของคุณ'}</span></button>)}</div>
    <div className="rl-number-comparison">{[false, true].map(plural => {
      const noun = plural ? item.plural : item.singular, verb = plural ? 'are' : 'is'
      return <div key={verb} data-lesson-layout={plural ? 'star' : 'soft'}>
        <div className="rl-number-picture" aria-label={plural ? 'หลายสิ่ง' : 'สิ่งเดียว'}><VocabularyPicture word={noun} count={plural ? 3 : 1}/></div>
        <ExampleLanguage matrix {...locationSentence(vocabulary.find(item=>item.word===noun)!,owner,`${plural ? 'หลาย' : 'หนึ่ง'}${item.classifier}`)} english={`Where **${verb}** ${owner} **${noun}?**`}/>
      </div>
    })}</div>
  </div>
}

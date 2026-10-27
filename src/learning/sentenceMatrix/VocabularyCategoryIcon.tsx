import VocabularyPicture from '../VocabularyPicture'
import WordSlotIcon from './WordSlotIcon'
import type { VocabularyCategory } from './vocabularyCategories'
const pictures={clothing:'shirt',buildings:'school',everyday:'key',furniture:'chair',sports:'racket',transport:'motorbike',people:'doctor'} as const
export default function VocabularyCategoryIcon({category}:{category:VocabularyCategory|'all'}) {
 return <span className="cw-category-icon" aria-hidden="true">{category==='all'
  ? <svg viewBox="0 0 32 32" fill="currentColor"><rect x="3" y="3" width="11" height="11" rx="3"/><rect x="18" y="3" width="11" height="11" rx="3"/><rect x="3" y="18" width="11" height="11" rx="3"/><rect x="18" y="18" width="11" height="11" rx="3"/></svg>
  : category==='food'?<WordSlotIcon slot={3}/>:category==='places'?<WordSlotIcon slot={0}/>:<VocabularyPicture word={pictures[category]}/>}</span>
}

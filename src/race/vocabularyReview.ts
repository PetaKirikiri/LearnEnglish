import {everydayNounOrder,everydayActionOrder,descriptionStages} from '../learning/everydayVocabulary'
import {createElement as h} from 'react'
import {createRoot} from 'react-dom/client'
import VocabularyPicture from '../learning/VocabularyPicture'
import {ActionIcon} from '../learning/sentenceMatrix/ActionVocabularyIcon'
import DescriptionPicture from '../learning/DescriptionPicture'
import './vocabularyReview.css'

const lists=[
 {title:'Nouns',words:everydayNounOrder,icon:VocabularyPicture},
 {title:'Verbs',words:everydayActionOrder,icon:ActionIcon},
 {title:'Descriptions',words:descriptionStages.flat(),icon:DescriptionPicture},
]
const root=document.querySelector<HTMLDivElement>('#vocabulary-review')!
createRoot(root).render(lists.map(list=>h('section',{key:list.title},
 h('h2',null,list.title),
 h('ol',null,list.words.map(word=>h('li',{key:word},
  h('span',{className:'vocab-review-row'},
   h('span',{className:'vocab-review-icon','aria-hidden':true},h(list.icon,{word})),
   h('span',null,word),
  ),
 ))),
)))

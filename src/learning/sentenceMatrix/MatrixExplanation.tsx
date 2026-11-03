import {ownerThai} from './model'
import TenseFilters from './TenseFilters'
import type { TimelineTense } from './TenseTimeline'
import VocabularyCategoryIcon from './VocabularyCategoryIcon'
import { vocabularyCategories, categoriesForWord, grammaticalNumber } from './vocabularyCategories'
import WordUsageVisual from './WordUsageVisual'
import EducationSectionHeading from './EducationSectionHeading'
import PronunciationComparison from '../../classroom/pronunciation/PronunciationComparison'
import { t, getLanguage } from '../../classroom/language'
import { useEffect, useRef, useState } from 'react'
import EducationFrame from './EducationFrame'
import { isPluralVerb, tenseForVerb, determiners, type BeVerb, type Determiner, type ClassroomWord } from './model'
import VocabularyPicture from '../VocabularyPicture'
import { slotReferences, fixedWordReferences, type ReferenceRow } from './wordReference'
import WordSlotIcon from './WordSlotIcon'
import '../../classroom/wordExplanation.css'

export type { Determiner } from './model'
export const matrixWordTypes = [
  {name:'คำถาม',english:'Question word',role:'บอกว่าเราต้องการรู้อะไร',explanation:'คำถามแต่ละคำใช้ถามข้อมูลต่างกัน ในประโยคนี้เราต้องการรู้สถานที่',colour:'#df2944',ink:'#fff'},
  {name:'คำกริยา',english:'Verb · be',role:'เชื่อมสิ่งที่พูดถึงกับข้อมูลของสิ่งนั้น',explanation:'ในคำถามนี้ กริยา be อยู่หน้าสิ่งที่ถามถึง รูปของคำเปลี่ยนตามเวลาและสิ่งที่พูดถึง',colour:'#128247',ink:'#fff'},
  {name:'คำกำหนดนาม',english:'Determiner',role:'บอกว่าสิ่งไหน หรือของใคร',explanation:'อยู่หน้าคำนาม และทำงานร่วมกับคำนาม เช่น สิ่งที่รู้กัน ของฉัน หรือของคุณ',colour:'#ffd43b',ink:'#18385e'},
  {name:'คำนาม',english:'Noun',role:'ชื่อของคน สถานที่ หรือสิ่งของ',explanation:'ในช่องนี้ เราใส่ชื่อสิ่งที่ต้องการถามหา เปลี่ยนคำนามได้โดยใช้รูปประโยคเดิม',colour:'#ffd43b',ink:'#18385e'},
] as const

export default function WordExplanation({id,slot,value,onChange,onBack,word,thai,onWord,catalogue,verb='is',onVerb,onExplainVerb,allowSelection=true,canChooseVerb,verbs=[{word:'is',thai:'หนึ่งสิ่ง'},{word:'are',thai:'หลายสิ่ง'}],owners=determiners}: {id:string;slot:number;value:Determiner;onChange:(word:Determiner)=>void;onBack:()=>void;word:string;thai:string;onWord:(word:string)=>void;catalogue:readonly ClassroomWord[];verb?:BeVerb;onVerb?:(verb:BeVerb)=>void;onExplainVerb?:(verb:BeVerb)=>void;allowSelection?:boolean;canChooseVerb?:(verb:BeVerb)=>boolean;verbs?:readonly {word:BeVerb;thai:string}[];owners?:readonly {word:Determiner;thai:string}[]}) {
  const type = matrixWordTypes[slot]
  const selected = ['Where',verb,value,word][slot]
  const owner = {gloss:ownerThai(value)}
  const category = slotReferences[slot]
  const item = catalogue.find(item=>item.word===word)!
  const [numberFilter,setNumberFilter]=useState<'singular'|'plural'>(()=>item.number==='plural'||item.pairOnly?'plural':'singular')
  const optionsRef=useRef<HTMLDivElement>(null)
  const wordNumber=grammaticalNumber
  const [categoryFilter,setCategoryFilter]=useState('all')
  const [tenseFilter,setTenseFilter]=useState<TimelineTense|null>(null)
  const hasNumberFilter=slot===3 && catalogue.some(entry=>wordNumber(entry)==='singular') && catalogue.some(entry=>wordNumber(entry)==='plural')
  const numberedWords=hasNumberFilter?catalogue.filter(entry=>wordNumber(entry)===numberFilter):catalogue
  const availableCategories=vocabularyCategories.filter(category=>catalogue.some(entry=>categoriesForWord(entry).includes(category.id)))
  const timeFilter=slot===3 && categoryFilter==='time'
  const visibleVerbs=verbs.filter(option=>(!hasNumberFilter || isPluralVerb(option.word)===(numberFilter==='plural')) && (!tenseFilter || tenseForVerb(option.word)===tenseFilter))
  const visibleWords=categoryFilter==='all'?numberedWords:numberedWords.filter(entry=>categoriesForWord(entry).some(id=>id===categoryFilter))
  useEffect(()=>{if(optionsRef.current)optionsRef.current.scrollLeft=0},[numberFilter,categoryFilter,tenseFilter])
  const numberRows: readonly ReferenceRow[] = item.pairOnly ? [['จำนวน','คำนี้ใช้เป็นพหูพจน์ แม้หมายถึงหนึ่งคู่ จึงใช้ are'],['รูปคำ','ไม่ตัด s ออกเพื่อบอกว่ามีหนึ่งคู่']] : item.number ? [['จำนวน',item.number==='plural'?'หลายสิ่ง ใช้ are ในคำถามนี้':'หนึ่งสิ่ง ใช้ is ในคำถามนี้'],['รูปคำ',`${item.singular} → ${item.plural}`],['ความสัมพันธ์','my และ your ไม่ได้บอกจำนวน ให้ดูคำนามเพื่อเลือก is หรือ are']] : [['จำนวน','รูปที่แสดงเป็นเอกพจน์ หมายถึงหนึ่งหน่วย'],['การใช้','เมื่อใช้คำนามนับได้เอกพจน์ในประโยค โดยทั่วไปต้องมีคำกำหนดนามอยู่ข้างหน้า']]
  const detail = fixedWordReferences[selected] ?? {
    meaning:thai,
    function:'คำนามนับได้ ใช้เรียกสถานที่หรือสิ่งของ',
    usage:numberRows,
  }
  return <EducationFrame id={id} selected={selected} category={getLanguage()==='th'?category.name:category.english} colour={type.colour} ink={type.ink} onBack={onBack}
    icon={slot===3?<VocabularyPicture word={selected}/>:<WordSlotIcon word={value} slot={slot} plural={slot===1 && isPluralVerb(verb)} past={slot===1 && tenseForVerb(verb)==='past'}/>}
    gloss={slot===0?'ที่ไหน':slot===1?(tenseForVerb(verb)==='past'?'อยู่ · ก่อนหน้านี้':'อยู่ · ปัจจุบัน'):slot===2?owner.gloss:thai}>
      <section className="cw-reference-word" lang={getLanguage()}>
        <EducationSectionHeading icon="usage">{getLanguage()==='th'?'การใช้คำนี้':'How it works'}</EducationSectionHeading>
        {slot===3 || slot===1?<WordUsageVisual item={item} tense={tenseForVerb(verb)}/>:<>
        <p className="cw-reference-function">{t(detail.function)}</p>
        <ReferenceRows rows={detail.usage}/>
        </>}
      </section>
      {/* Permanent education section: never gate on slot, word, or available pronunciation data. */}
      <PronunciationComparison word={selected}/>
      {allowSelection && (slot===2 || slot===3 || (slot===1 && onVerb)) && <section className="cw-vocabulary-section">
      <EducationSectionHeading icon="words" actions={(slot===1 || hasNumberFilter || (slot===3 && availableCategories.length>0)) && <div className="cw-vocabulary-filters">
      {(slot===1 || timeFilter) && <TenseFilters value={tenseFilter} onChange={setTenseFilter} controls={`${id}-words`}/>}
      {hasNumberFilter && <div className="cw-number-filter" role="group" aria-label="Filter vocabulary by number">
        {(['singular','plural'] as const).map(number=><button key={number} type="button" aria-label={number==='singular'?'Singular words':'Plural words'} title={number==='singular'?'Singular':'Plural'} aria-pressed={numberFilter===number} aria-controls={`${id}-words`} onClick={()=>{
          setNumberFilter(number)
          if(categoryFilter!=='all' && categoryFilter!=='time' && !catalogue.some(entry=>wordNumber(entry)===number && categoriesForWord(entry).some(id=>id===categoryFilter)))setCategoryFilter('all')
        }}><WordSlotIcon slot={3} plural={number==='plural'}/></button>)}
      </div>}
      {slot===3 && availableCategories.length>0 && <div className="cw-category-filters" role="group" aria-label="Vocabulary categories">
        <button type="button" aria-label={getLanguage()==='th'?'ทั้งหมด':'All'} title={getLanguage()==='th'?'ทั้งหมด':'All'} aria-pressed={categoryFilter==='all'} aria-controls={`${id}-words`} onClick={()=>setCategoryFilter('all')}><VocabularyCategoryIcon category="all"/></button>
        {verbs.length>0 && <button type="button" data-category="time" aria-label={getLanguage()==='th'?'เวลา · be':'Time · be'} title={getLanguage()==='th'?'เวลา · be':'Time · be'} aria-pressed={timeFilter} aria-controls={`${id}-words`} onClick={()=>setCategoryFilter(timeFilter?'all':'time')}><VocabularyCategoryIcon category="time"/></button>}
        {availableCategories.map(category=><button key={category.id} type="button" data-category={category.id} aria-label={getLanguage()==='th'?category.th:category.en} title={getLanguage()==='th'?category.th:category.en} aria-pressed={categoryFilter===category.id} aria-controls={`${id}-words`} onClick={()=>{
          if(categoryFilter===category.id){setCategoryFilter('all');return}
          setCategoryFilter(category.id)
          if(hasNumberFilter && !numberedWords.some(entry=>categoriesForWord(entry).includes(category.id))) {
            const match=catalogue.find(entry=>categoriesForWord(entry).includes(category.id))
            if(match)setNumberFilter(wordNumber(match))
          }
        }}><VocabularyCategoryIcon category={category.id}/></button>)}
      </div>}
      </div>}>{getLanguage()==='th'?(slot===3?'คำศัพท์':'เลือกคำ'):(slot===3?'Vocabulary':'Choose a word')}</EducationSectionHeading>
      <div ref={optionsRef} id={`${id}-words`} className={`cw-word-options${hasNumberFilter?' has-number-filter':''}`} role="group" aria-label={t('เลือกคำ')}>
        {(timeFilter ? visibleVerbs : slot===1 ? visibleVerbs : slot===2 ? owners : visibleWords).map(option=><button key={option.word} aria-pressed={(timeFilter?verb:selected)===option.word} disabled={(slot===1 || timeFilter) && (canChooseVerb ? !canChooseVerb(option.word as BeVerb) : option.word==='is' && item.pairOnly)} onClick={()=>timeFilter?(onExplainVerb??onVerb)?.(option.word as BeVerb):slot===1?onVerb?.(option.word as BeVerb):slot===2?onChange(option.word as Determiner):onWord(option.word)}>{timeFilter?<WordSlotIcon slot={1} plural={isPluralVerb(option.word as BeVerb)} past={tenseForVerb(option.word as BeVerb)==='past'}/>:slot===2?<WordSlotIcon slot={2} word={option.word}/>:slot===3 && <VocabularyPicture word={option.word}/>}<strong>{option.word}</strong><span lang={getLanguage()}>{option.thai}</span></button>)}
      </div>
      {(slot===1 || timeFilter) && visibleVerbs.length===0 && <p className="cw-filter-empty" role="status">{getLanguage()==='th'?'ไม่มีคำในบทเรียนนี้ที่ตรงกับตัวกรอง':'No words in this lesson match this filter.'}</p>}
      </section>}
  </EducationFrame>
}

function ReferenceRows({rows}:{rows:readonly ReferenceRow[]}) {
  return <dl className="cw-reference-rows" lang={getLanguage()}>{rows.map(([label,value])=><div key={label}><dt>{t(label)}</dt><dd>{t(value)}</dd></div>)}</dl>
}

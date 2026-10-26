// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it} from 'vitest'
import {existsSync,readFileSync} from 'node:fs'
import {birdArtwork,birdAssets,birdAssetUrl,artworkForBird} from './birdArtwork'
import CurriculumPage from './CurriculumPage'
import {birdStructures,plainBirdSentence} from './birdStructures'
import {birdDialogues} from './birdDialogues'
import {birdPatternFamilies,birdExchangeKey,visibleBirdPatterns} from './birdPatternFamilies'
import {birdGlosses,glossBirdSentence} from './birdGlosses'
import {curriculumSchema} from './schema'
import {scopeCurriculum} from './courseScope'
import {installCurriculum,selectLearningCourse} from './database'
import snapshot from './syllabus.snapshot.json'

Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('groups variations into construction families without losing examples or repeating exchanges',()=>{
  const english=scopeCurriculum(curriculumSchema.parse(snapshot),'english')
  const families=visibleBirdPatterns(english)
  expect(families).toHaveLength(27)
  const dialogues=families.flatMap(family=>family.dialogues)
  expect(dialogues).toHaveLength(92)
  expect(new Set(dialogues.map(birdExchangeKey)).size).toBe(dialogues.length)
  const assigned=birdPatternFamilies.flatMap(family=>family.dialogues.map(d=>d.key))
  const expected=birdDialogues.filter(group=>group.nodeId!=='verb-shapes').flatMap(group=>group.dialogues.map(d=>`${group.nodeId}:${d.meaning}`))
  expect(assigned.slice().sort()).toEqual(expected.sort())
  expect(new Set(assigned).size).toBe(assigned.length)
  expect(families.map(f=>f.id)).not.toContain('reference')
  expect(families.map(f=>f.id)).not.toContain('verb-shapes')
  expect(families.find(f=>f.id==='progressive')!.dialogues.filter(d=>d.nodeId==='reference')).toHaveLength(4)
  expect(families.find(f=>f.id==='having')!.dialogues.map(d=>d.meaning)).toContain('Hardly any')
  expect(families.find(f=>f.id==='conditionals')!.dialogues.map(d=>plainBirdSentence(d.question.english))).toContain('Would the bird be hungry now if it had eaten the seed?')
  expect(families.find(f=>f.id==='past-timeline')!.dialogues.some(d=>d.purpose==='composition')).toBe(true)
  for(const dialogue of dialogues) {
    expect(artworkForBird(dialogue.nodeId,dialogue.meaning)).toBeTruthy()
    expect(glossBirdSentence(dialogue.question.english)).toBeTruthy()
    expect(glossBirdSentence(dialogue.answer.english)).toBeTruthy()
  }
})
it('filters individual examples inside mixed-level families and keeps family numbers stable',()=>{
  const english=scopeCurriculum(curriculumSchema.parse(snapshot),'english')
  const nodes=new Map(english.skills.map(s=>[s.id,s]))
  for(const level of ['A1','A2','B1','B2']){
    const filtered=visibleBirdPatterns(english,level)
    for(const family of filtered){
      expect(family.number).toBe(birdPatternFamilies.find(f=>f.id===family.id)!.number)
      expect(family.dialogues.every(d=>nodes.get(d.nodeId)?.level===level)).toBe(true)
    }
    const expected=new Set(birdPatternFamilies.flatMap(f=>f.dialogues).filter(d=>nodes.get(d.nodeId)?.level===level).map(birdExchangeKey))
    expect(new Set(filtered.flatMap(f=>f.dialogues).map(birdExchangeKey))).toEqual(expected)
  }
  expect(visibleBirdPatterns({...english,skills:[]},'All')).toEqual([])
})
it('aligns contextual Thai reading units for every question and answer without changing the English',()=>{
  const lines=birdDialogues.flatMap(group=>group.dialogues.flatMap(d=>[d.question,d.answer]))
  expect(lines).toHaveLength(198)
  expect(birdGlosses.size).toBe(156)
  for(const line of lines){
    const units=glossBirdSentence(line.english)
    expect(units.map(unit=>unit.english).join(' ')).toBe(plainBirdSentence(line.english))
    for(const unit of units) expect(unit.thai).toMatch(/[\u0e00-\u0e7f]|^—$/)
  }
  expect(glossBirdSentence('The bird **has eaten** the seed.')).toContainEqual({english:'has eaten',thai:'กินไปแล้ว'})
  expect(glossBirdSentence('The bird **has** three seeds.')).toContainEqual({english:'has',thai:'มี'})
  expect(glossBirdSentence('The seed **was eaten**.')).toContainEqual({english:'was eaten.',thai:'ถูกกินไปแล้ว'})
  expect(glossBirdSentence('The bird **must be eating** the seed.')).toContainEqual({english:'must be eating',thai:'คงกำลังกินแน่ ๆ'})
  expect(()=>glossBirdSentence('Unreviewed example.')).toThrow('Missing contextual reading gloss')
})
it('provides complete, marked bird observations for every English topic',()=>{
  const english=scopeCurriculum(curriculumSchema.parse(snapshot),'english')
  // Curriculum topics are not automatically distinct sentence constructions.
  expect(new Set(birdStructures.map(g=>g.nodeId))).toEqual(new Set(english.skills.filter(s=>s.id!=='focus').map(s=>s.id)))
  expect(birdStructures).toHaveLength(39)
  expect(birdStructures.some(g=>g.nodeId==='focus')).toBe(false)
  expect(birdStructures.flatMap(g=>g.sentences).length).toBeGreaterThan(100)
  for(const group of birdStructures){
    expect(group.sentences.length).toBeGreaterThanOrEqual(2)
    for(const sentence of group.sentences){
      expect(sentence.english.split('**').length%2).toBe(1)
      expect(sentence.english).toContain('**')
      expect(plainBirdSentence(sentence.english)).not.toMatch(/\[|\]|____/)
      expect(sentence.thai).toMatch(/[\u0e00-\u0e7f]/)
      expect(sentence.meaning).not.toBe('')
    }
  }
  const completion=birdStructures.find(g=>g.nodeId==='completion')!.sentences.map(s=>plainBirdSentence(s.english))
  expect(completion).toContain('The bird is eating the seed.')
  expect(completion).toContain('The bird has eaten the seed.')
  expect(completion).toContain('The bird has not eaten the seed yet.')
})
it('shows full comparisons in the real English structures view and filters by level',async()=>{
  installCurriculum(snapshot);selectLearningCourse('english')
  const host=document.createElement('div'),root=createRoot(host)
  await act(()=>root.render(<CurriculumPage referenceOnly/>))
  expect(host.querySelectorAll('.bird-comparison')).toHaveLength(27)
  expect(host.textContent).not.toContain('Moving “only”')
  expect(host.querySelectorAll('.bird-sentence')).toHaveLength(92)
  expect(host.querySelectorAll('.example-language')).toHaveLength(184)
  expect(host.textContent).not.toContain('The helper changes the verb’s form')
  expect(host.textContent).not.toContain('Which bird—and how many')
  for(const example of host.querySelectorAll('.example-language')){
    const units=[...example.querySelectorAll('.example-unit')]
    expect(units.length).toBeGreaterThan(1)
    expect(units.map(unit=>unit.querySelector('.example-source')?.textContent).join(' ')).toBe(example.querySelector('.example-alignment')?.getAttribute('aria-label'))
    for(const unit of units) expect(unit.querySelector('.example-gloss')?.getAttribute('lang')).toBe('th')
    expect(example.lastElementChild?.classList.contains('example-translation')).toBe(true)
  }
  const numbers=[...host.querySelectorAll('h2 .bird-number')].map(el=>el.textContent)
  expect(numbers).toEqual(Array.from({length:27},(_,index)=>`${index+1}.`))
  expect(host.querySelector('.bird-dialogue .bird-number')).toBeNull()
  expect(host.querySelector('.bird-meaning')).toBeNull()
  const originalNumbers=new Map([...host.querySelectorAll('.bird-comparison')].map(group=>[group.getAttribute('aria-labelledby'),[...group.querySelectorAll('.bird-number')].map(el=>el.textContent)]))
  for(const exchange of host.querySelectorAll('.bird-dialogue')){
    expect(exchange.querySelectorAll('.bird-turn')).toHaveLength(2)
    expect(exchange.querySelector('.bird-turn')?.classList.contains('bird-question')).toBe(true)
    expect(exchange.querySelector('.bird-question .bird-speaker')?.getAttribute('alt')).toBe('Teacher wolf asking')
    expect(exchange.querySelector('.bird-question .bird-speaker')?.getAttribute('src')).toBe('/images/fimo/success-wolf-grey-clay.png')
    expect(exchange.querySelector('.bird-answer .bird-speaker')?.getAttribute('alt')).toBe('Answering')
    expect(exchange.querySelectorAll('.bird-scene')).toHaveLength(2)
    expect(exchange.querySelectorAll('.bird-bubble .bird-scene')).toHaveLength(0)
    expect(exchange.querySelectorAll('.bird-visual > .bird-scene')).toHaveLength(2)
    for(const scene of exchange.querySelectorAll('.bird-scene')) {
      expect(scene.getAttribute('aria-label')).not.toBe('')
      expect(scene.querySelectorAll('img').length).toBeGreaterThan(0)
      expect(scene.querySelector('img')?.getAttribute('loading')).toBe('lazy')
    }
  }
  expect(host.querySelectorAll('details')).toHaveLength(0)
  expect(host.querySelector('.pattern-slot')).toBeNull()
  expect(host.querySelector('[aria-label="The bird has eaten the seed."] strong')?.textContent).toBe('has eaten')
  const select=host.querySelector('select')!
  await act(()=>{select.value='B1';select.dispatchEvent(new Event('change',{bubbles:true}))})
  expect(host.querySelectorAll('.bird-comparison')).toHaveLength(7)
  for(const group of host.querySelectorAll('.bird-comparison')) {
    expect([...group.querySelectorAll('.bird-number')].map(el=>el.textContent)).toEqual(originalNumbers.get(group.getAttribute('aria-labelledby')))
  }
  expect(host.textContent).toContain('What was happening or had already happened')
  expect(host.textContent).not.toContain('Naming and identifying')
  await act(()=>root.render(<CurriculumPage key="words" initialView="vocabulary" referenceOnly/>))
  expect(host.querySelector('.bird-structures')).toBeNull()
  expect(host.querySelector('table')).not.toBeNull()
  await act(()=>root.unmount());installCurriculum(snapshot)
})

it('has authored question and answer artwork for every dialogue, with real local files',()=>{
  expect(Object.keys(birdArtwork).sort()).toEqual(birdDialogues.map(g=>g.nodeId).sort())
  for(const group of birdDialogues){
    expect(Object.keys(birdArtwork[group.nodeId]).sort()).toEqual(group.dialogues.map(d=>d.meaning).sort())
    for(const dialogue of group.dialogues){
      const art=artworkForBird(group.nodeId,dialogue.meaning)
      for(const scene of [art.question,art.answer]) {
        expect(scene.frames.length).toBeGreaterThan(0)
        expect(scene.frames.length).toBeLessThanOrEqual(3)
        expect(scene.description.length).toBeGreaterThan(10)
        for(const frame of scene.frames) expect(existsSync(`public${birdAssetUrl(frame.asset)}`),frame.asset).toBe(true)
      }
    }
  }
  for(const asset of Object.keys(birdAssets) as (keyof typeof birdAssets)[]){
    const file=readFileSync(`public${birdAssetUrl(asset)}`)
    expect(file.length,asset).toBeGreaterThan(1000)
    if(asset!=='person') expect(file.subarray(8,12).toString()).toBe('WEBP')
  }
  expect(()=>artworkForBird('unknown','unknown')).toThrow('Missing bird illustration')
})

it('shows the unknown and filled name, and preserves number, role and temporal contrasts',()=>{
  const names=artworkForBird('meeting-names','Its name')
  expect(names.question.frames[0].asset).toBe('name-blank')
  expect(names.answer.frames[0].asset).toBe('name-filled')
  expect(artworkForBird('first-actions','More than one').answer.frames[0].asset).toBe('plural-eating')
  expect(artworkForBird('participants','The male bird acts').answer.frames[0].asset).toBe('he-sees-her')
  expect(artworkForBird('participants','The female bird acts').answer.frames[0].asset).toBe('she-sees-him')
  expect(artworkForBird('completion','In progress').answer.frames[0].asset).toBe('eating')
  expect(artworkForBird('completion','Completed').answer.frames.map(f=>f.asset)).toEqual(['eating','finished'])
  expect(artworkForBird('completion','Not yet').answer.frames[0].asset).toBe('waiting')
  const before=artworkForBird('sequence','Eating first').answer.frames.map(f=>f.asset)
  const after=artworkForBird('sequence','Flying first').answer.frames.map(f=>f.asset)
  expect(before).toEqual(['eating','flying']);expect(after).toEqual(['flying','eating'])
  expect(artworkForBird('hypothetical','Imagined situation').answer.imagined).toBe(true)
  expect(artworkForBird('hypothetical','Open possibility').answer.imagined).not.toBe(true)
  expect(artworkForBird('passive','Leave the eater unnamed').answer.frames.map(f=>f.asset)).toEqual(['seed','shell'])
})

it('makes origin visible in both pictures instead of using a generic bird question',()=>{
  const origin=artworkForBird('meeting-origins','Origin')
  expect(origin.question.frames[0].asset).toBe('origin-question')
  expect(origin.answer.frames[0].asset).toBe('origin-answer')
  expect(origin.question.description).toContain('starting place')
  expect(origin.answer.description).toContain('from Thailand towards Pip')
  // The question is part of the source marker, not a floating mark by the bird.
  expect(origin.question.unknown).not.toBe(true)
})

it('gives every question an authored visual target or a specific illustrated unknown',()=>{
  const illustratedUnknowns=new Set(['name-blank','origin-question','ownership-question','location-question','permission-self','request-help'])
  for(const [node,meanings] of Object.entries(birdArtwork)) for(const [meaning,{question,answer}] of Object.entries(meanings)) {
    const label=`${node}/${meaning}`
    expect(question.unknown,label).not.toBe(true)
    expect(question.target||question.frames.some(f=>illustratedUnknowns.has(f.asset)),label).toBeTruthy()
    expect(answer.badge,label).toBeUndefined()
    if(node!=='meeting-people') expect(question.frames.map(f=>f.asset),label).not.toEqual(['neutral'])
    for(const frame of [...question.frames,...answer.frames,...question.reality??[],...answer.reality??[]]) {
      expect(existsSync(`public${birdAssetUrl(frame.asset)}`),`${label}: ${frame.asset}`).toBe(true)
    }
  }
})

it('makes time, agency, evidence and alternatives visible instead of changing captions only',()=>{
  const get=(node:string,meaning:string)=>artworkForBird(node,meaning).answer
  expect(get('routine-now','A habit').repeated).toBe(true)
  expect(get('routine-now','In progress').time).toBe('present')
  expect(get('past-state','Then').time).toBe('past')
  expect(get('future','A prediction').time).toBe('future')
  expect(get('past-sequence','In progress then').relationship).toBe('same-time')
  expect(get('past-sequence','Finished before then').relationship).toBe('sequence')
  expect(get('obligation','Ability').frames[0].asset).toBe('able')
  expect(get('obligation','Necessary').frames[0].asset).toBe('need-food')
  expect(get('obligation','Advisable').frames[0].asset).toBe('advice-eat')
  expect(get('verb-complements','The bird will do it').frames[0].asset).toBe('want-eat')
  expect(get('verb-complements','The bird wants me to do it').frames[0].asset).toBe('wants-person')
  expect(artworkForBird('request-basics','Permission for me').question.frames[0].asset).toBe('permission-self')
  expect(artworkForBird('request-basics','Help from you').question.frames[0].asset).toBe('request-help')
  for(const meaning of ['A different past result','A different result now']) {
    expect(get('counterfactual',meaning).reality?.map(f=>f.asset)).toEqual(['waiting','hungry'])
    expect(get('counterfactual',meaning).imagined).toBe(true)
  }
  expect(get('complex-time','Eating was already finished').frames.map(f=>f.asset)).toEqual(['leave-seed','finished','arriving'])
  expect(get('complex-time','Eating was still happening').relationship).toBe('same-time')
})

it('pairs every observation with a question followed by a real reply',()=>{
  for(const group of birdDialogues) for(const dialogue of group.dialogues){
    expect(plainBirdSentence(dialogue.question.english).endsWith('?'),group.nodeId).toBe(true)
    expect(plainBirdSentence(dialogue.answer.english).endsWith('?'),group.nodeId).toBe(false)
    expect(dialogue.question.thai).toMatch(/[\u0e00-\u0e7f]/)
    expect(dialogue.answer.thai).toMatch(/[\u0e00-\u0e7f]/)
  }
  const opening=birdDialogues[0].dialogues
  expect(opening).toHaveLength(1)
  expect(plainBirdSentence(opening[0].question.english)).toBe('What is the bird’s name?')
  expect(plainBirdSentence(opening[0].answer.english)).toBe('The bird’s name is Pip.')
  const permission=birdDialogues.find(g=>g.nodeId==='request-basics')!.dialogues
  expect(plainBirdSentence(permission[0].answer.english)).toBe('Yes, you can feed the bird.')
  expect(plainBirdSentence(permission[1].answer.english)).toBe('Yes, I can feed the bird.')
})

it('combines incidental reply variants without losing meaningful contrasts',()=>{
  const group=(id:string)=>birdDialogues.find(g=>g.nodeId===id)!.dialogues
  expect(group('meeting-belongings')).toHaveLength(1)
  expect(plainBirdSentence(group('meeting-belongings')[0].answer.english)).toBe('This is the bird’s seed.')
  expect(group('be-forms')).toHaveLength(2)
  expect(group('time-place')).toHaveLength(2)
  expect(group('completion')).toHaveLength(3)
  expect(group('completion').map(d=>plainBirdSentence(d.answer.english))).toEqual([
    'The bird is eating the seed.','The bird has eaten the seed.','The bird has not eaten the seed yet.',
  ])
  expect(group('first-negatives')).toHaveLength(2)
  expect(group('participants')).toHaveLength(4)
  expect(group('reference')).toHaveLength(4)
})

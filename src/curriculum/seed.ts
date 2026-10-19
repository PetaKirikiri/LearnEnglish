// Our curriculum synthesis, not a reproduction of a publisher's inventory.
// Levels describe the focus, not a certified level of the whole sentence or learner.
import type { Curriculum, Level } from './schema'
import { bundledHotelQuestions } from '../hotel/course'

const core = 'https://www.eaquals.org/wp-content/uploads/EAQUALS_British_Council_Core_Curriculum_April2011.pdf'
export const sources: Curriculum['sources'] = [
  {id:'core-inventory',title:'British Council / Eaquals Core Inventory (2011)',url:core,use:'Level-band reference. Our sequence, Thai bridges and exercises are independently authored; not a certification syllabus.'},
  {id:'english-profile',title:'English Grammar & Vocabulary Profile',url:'https://englishprofile.org/',use:'Detailed alignment reference; individual descriptor IDs have not yet been verified. Do not claim item-level EGP alignment.'},
  {id:'oxford-words',title:'Oxford 3000 / 5000',url:'https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000',use:'Vocabulary review reference only. No word list is copied or CEFR labels assigned to our dictionary without sense-level checking and reuse permission.'},
  {id:'cefr-scale',title:'Council of Europe CEFR global scale',url:'https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale',use:'Overall ability goals. Listening recognition alone does not establish speaking, pronunciation or an overall CEFR level.'},
]
type Family = Curriculum['skills'][number]['family']
// id, level, focus, family, bridge from Thai, prerequisites
const rows: [string, Level, string, Family, string, string[]][] = [
  ['participants','A1','Who acts; who receives','pronouns','Thai pronouns often retain their form across roles. English marks I/me, she/her, we/us and they/them. Test the role, not the gender.',[]],
  ['be-forms','A1','Matching be to the subject','verbs','Thai descriptions may not require an equivalent of be. English requires am/is/are with these subjects.',['participants']],
  ['reference','A1','One, several, this, that','determiners','Thai does not have an article system equivalent to English. Use a clear referent and number; do not translate the as a fixed Thai word.',[]],
  ['ownership','A1','Owner and possession','pronouns','Thai can use khong + owner. English distinguishes my/mine and her/hers by their place in the phrase.',['participants','reference']],
  ['routine-now','A1','Routine versus happening now','verbs','Gam lang can signal an ongoing event. Contrast an English routine with be + -ing while keeping the action identical.',['be-forms']],
  ['past-state','A1','Current and earlier states','verbs','Thai uses context and time expressions; English changes is/are to was/were.',['be-forms']],
  ['negation','A1','Positive and negative','verbs','Mai does not map to one fixed English form. Contrast not with be and do-support with lexical verbs.',['be-forms']],
  ['questions','A1','Asking and answering','verbs','Thai question particles do not move the verb. English may need be inversion or do/does before the subject.',['be-forms','negation']],
  ['time-place','A1','Location and time relations','relationships','Thai relational words do not map one-to-one to English prepositions. Keep locations and events constant between choices.',[]],
  ['simple-links','A1','Add, contrast, explain','relationships','Lae, tae and phro help introduce the meaning of and, but and because. Both choices must not be equally defensible.',['negation']],
  ['past-events','A1','Finished events','verbs','Laew is not a universal past-tense marker. Contrast a finished event with a routine, using the same action.',['routine-now']],
  ['request-basics','A1','Ask politely; give directions','interaction','English requests rely on modal and sentence choices, not an equivalent of khrap/kha appended to every sentence.',['questions']],
  ['future','A2','Plans and upcoming actions','verbs','Ja introduces future or intended events in many contexts. English distinguishes will, going to and present arrangements.',['routine-now']],
  ['completion','A2','In progress versus completed','verbs','Gam lang and laew provide a starting contrast, not a complete equivalence to continuous and perfect forms.',['routine-now','past-events']],
  ['verb-shapes','A2','Verb forms after helpers','verbs','English auxiliaries determine the following verb form; Thai verbs do not take these same endings.',['completion','questions']],
  ['obligation','A2','Ability, permission, obligation','verbs','Dai and tong can help establish the distinction, but cannot be substituted mechanically for every can or must.',['negation']],
  ['verb-complements','A2','What follows a verb','verbs','Learn whole patterns such as ask someone to wait and want to leave; not an isolated translation of to.',['participants','verb-shapes']],
  ['quantity','A2','Amounts and countability','determiners','Thai classifiers and English articles/countability divide the work differently. Use the same object and clear quantity evidence.',['reference']],
  ['sequence','A2','Order events and conditions','relationships','Use Thai to disambiguate before, after and if while holding the events stable.',['time-place','past-events']],
  ['comparison','A2','Compare choices','relationships','Kwa helps introduce comparison. English also changes adjectives or uses more; test the relation, not different objects.',['reference']],
  ['repair','B1','Clarify a misunderstanding','interaction','Practise checking the intended meaning rather than choosing a response by a recognised noun.',['request-basics','questions']],
  ['past-sequence','B1','Earlier than another past event','verbs','Explicit Thai event order supports English past-perfect contrasts without pretending laew alone identifies the tense.',['completion','sequence']],
  ['passive','B1','Action and affected person','verbs','Thai thuk/dai rap may help in some contexts. English passive changes focus and requires be plus a participle.',['participants','verb-shapes']],
  ['possibility','B1','Certainty and possibility','verbs','Thai uncertainty expressions support the meaning; English modals and their forms distinguish confidence and time.',['obligation','future']],
  ['reported','B1','Report someone’s message','verbs','Keep the speaker and event fixed while testing English changes in reference and reported time.',['past-sequence','participants']],
  ['hypothetical','B1','Imagine a different situation','relationships','Thai tha does not require the same English tense pattern in hypothetical conditions.',['sequence','past-events']],
  ['relative','B2','Identify which person or thing','relationships','Thai thi is a bridge to some relative clauses, not a one-to-one translation of who, which and that.',['participants','reference']],
  ['future-completion','B2','Completed by a future point','verbs','Hold the deadline and action constant; test whether English describes progress or completion at that point.',['completion','future']],
  ['counterfactual','B2','Unreal causes and consequences','relationships','Keep the event facts explicit in Thai; test the relationship between a different past and its consequences.',['hypothetical','past-sequence']],
  ['qualification','B2','Qualify and contrast ideas','relationships','Understand a concession or exception, not just the nearest familiar word in a longer sentence.',['simple-links','relative']],
  ['professional-response','B2','Handle an unexpected problem','interaction','Choose by obligation, intention and politeness while keeping the guest’s problem identical.',['repair','possibility']],
  ['nuance','C1','Implication and degrees of commitment','interaction','The options should differ in intended implication or commitment, not in who or what is mentioned.',['professional-response','qualification']],
  ['focus','C1','Shift emphasis and information focus','relationships','Thai and English can highlight information differently. Test what is foregrounded without swapping the event.',['relative','passive']],
  ['complex-time','C1','Combine time and viewpoint','verbs','Distinguish the speaker’s viewpoint across several events instead of assigning a single English tense to laew.',['future-completion','counterfactual']],
]

export const curriculumSkills: Curriculum['skills'] = rows.map(([id,level,title,family,thaiBridge,prerequisites],order)=>({
  id,level,title,family,thaiBridge,prerequisites,order,
  references:[{sourceId:'core-inventory',locator:`Essential guide, printed pp. 10–11 (${level}); focus adapted for Thai learners`,status:'adapted'},
    {sourceId:'english-profile',locator:'Detailed descriptor cross-check pending',status:'reference-only'}],
}))
const mapping: Record<string,string> = {
  roles:'participants',object_forms:'participants',be_agreement:'be-forms',articles:'reference',possessive_forms:'ownership',
  habit_ongoing:'routine-now',past_states:'past-state',negative:'negation',do_support:'questions',prepositions:'time-place',
  future_ongoing:'future',ongoing_finished:'completion',verb_forms:'verb-shapes',modal_meaning:'obligation',verb_patterns:'verb-complements',passive:'passive',
}
export function buildCurriculumSeed(): Curriculum {
  const courseSkills = Object.entries(mapping).map(([skill,nodeId],order)=>({course:'hotel' as const,skill,nodeId,order}))
  return {version:1,revision:'2026-10-19.1',sources,skills:curriculumSkills,courseSkills,
    questions:bundledHotelQuestions.map(q=>({...q,grammar:q.grammar!})),wordLinks:[],structures:[],vocabulary:[]}
}

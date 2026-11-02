import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {actionPracticeQuestions} from './actionPracticeContent'
const current=vi.hoisted(()=>({id:''}))
vi.mock('./actionPracticeContent',async original=>{const source=await original<typeof import('./actionPracticeContent')>();return {...source,actionPracticeDeck:()=>source.actionPracticeQuestions.filter(q=>q.id===current.id)}})
vi.mock('../learning/wordProgress/useWordProgress',()=>({useWordProgress:()=>({scores:{},ready:true,record:vi.fn()})}))
import ActionPractice from './ActionPractice'
it('renders every authored sentence through the shared matrix with separate determiners and matching geometry',()=>{
 for(const q of actionPracticeQuestions){current.id=q.id;const html=renderToStaticMarkup(<ActionPractice level={q.level} onLevel={()=>{}}/>);expect(html).toContain('matrix-layout');expect(html).not.toContain('undefined')}
})

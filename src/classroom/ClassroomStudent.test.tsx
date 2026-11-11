import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
const mocks=vi.hoisted(()=>({activity:vi.fn(),drawing:vi.fn(),classroom:vi.fn()}))
vi.mock('./activity',()=>({useClassActivity:mocks.activity}))
vi.mock('../drawing/game',()=>({useDrawingGame:mocks.drawing}))
vi.mock('./session',()=>({classroomCall:mocks.classroom}))
vi.mock('../drawing/DrawingGame',()=>({DrawingStudent:()=> <div>Same-class drawing</div>}))
vi.mock('./ClassroomPractice',()=>({default:({turn}:{turn:{questionId:string}})=><div>Shared question {turn.questionId}</div>}))
vi.mock('../race/PracticeHeader',()=>({default:()=>null}))
import ClassroomStudent from './ClassroomStudent'
it('follows the shared Lesson 6 turn and activity changes without rejoining',async()=>{
 const el=document.createElement('div'),root=createRoot(el)
 mocks.classroom.mockResolvedValue({id:'class-1',members:[{id:'student-1',name:'Ann',active:true}],turn:{id:'turn',learner:'student-1',questionId:'identify-v1-this-phone',choices:['this','that'],answer:null}})
 mocks.drawing.mockReturnValue({game:{active:true,drawings:[],scores:[]},busy:false,error:'',act:vi.fn(),offset:{current:0}})
 async function show(activity:string){mocks.activity.mockReturnValue({activity:{activity,lesson:6},error:''});await act(async()=>root.render(<ClassroomStudent sessionId="class-1" userId="student-1"/>))}
 await show('board');expect(el.textContent).not.toContain('Shared question')
 await show('test');expect(el.textContent).toContain('Shared question identify-v1-this-phone');expect(el.querySelector('a,img')).toBeNull()
 await show('race');expect(el.textContent).toContain('Same-class drawing')
 await show('board');expect(el.textContent).not.toContain('Same-class drawing')
 await show('test');expect(el.textContent).toContain('Shared question identify-v1-this-phone')
 expect(mocks.classroom.mock.calls.filter(([action])=>action==='join')).toEqual([['join','class-1']])
 await act(async()=>root.unmount())
})

// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
const mocks=vi.hoisted(()=>({activity:vi.fn(),drawing:vi.fn(),classroom:vi.fn()}))
vi.mock('./activity',()=>({useClassActivity:mocks.activity}))
vi.mock('../drawing/game',()=>({useDrawingGame:mocks.drawing}))
vi.mock('./session',()=>({classroomCall:mocks.classroom}))
vi.mock('../drawing/DrawingGame',()=>({DrawingStudent:()=> <div>Same-class drawing</div>}))
vi.mock('./ClassroomPractice',()=>({default:({turn,question}:{turn:{questionId:string};question:{id:string}})=><div data-question={question.id}>Shared question {turn.questionId}</div>}))
vi.mock('../race/PracticeHeader',()=>({default:()=>null}))
import ClassroomStudent from './ClassroomStudent'
import {classroomWordQuestion} from './wordServer'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
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
 expect(mocks.classroom.mock.calls.filter(([action])=>action==='join').map(args=>args.slice(0,2))).toEqual([['join','class-1']])
 await act(async()=>root.unmount())
})

it('renders the server-selected personal question rather than looking it up in the old classroom catalogue',async()=>{
 mocks.classroom.mockClear()
 const question=classroomWordQuestion(6,'student-1',[],[],0,'phone-test').question
 const el=document.createElement('div'),root=createRoot(el)
 mocks.classroom.mockResolvedValue({id:'class-2',members:[{id:'student-1',name:'Ann',active:true}],turn:{id:'adaptive-turn',learner:'student-1',questionId:question.id,question,choices:question.choices,answer:null}})
 mocks.activity.mockReturnValue({activity:{activity:'test',lesson:6},error:''})
 mocks.drawing.mockReturnValue({game:null,busy:false,error:'',act:vi.fn(),offset:{current:0}})
 try{
  await act(async()=>root.render(<ClassroomStudent sessionId="class-2" userId="student-1"/>))
  expect(el.querySelector('[data-question]')?.getAttribute('data-question')).toBe(question.id)
  expect(mocks.classroom.mock.calls.filter(([action])=>action==='join')).toHaveLength(1)
 }finally{await act(async()=>root.unmount())}
},30000)

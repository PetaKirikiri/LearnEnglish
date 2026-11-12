import {beforeEach,expect,it,vi} from 'vitest'
const mock=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn(),upsert:vi.fn(),rows:[] as unknown[],history:[] as unknown[]}))
vi.mock('@supabase/supabase-js',()=>({createClient:()=>({rpc:mock.rpc,from:mock.from})}))
import handler from '../../server/classroomNext'
const secret='a'.repeat(64)
beforeEach(()=>{
 vi.stubEnv('SUPABASE_URL','https://database.invalid');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','server-only')
 mock.rows=[];mock.history=[];mock.rpc.mockReset();mock.upsert.mockReset().mockResolvedValue({error:null})
 mock.from.mockImplementation((table:string)=>{
  const query={select:()=>query,eq:()=>query,order:()=>query,range:async()=>({data:mock.rows,error:null}),limit:async()=>({data:mock.history,error:null}),upsert:mock.upsert}
  if(!['english_word_progress','english_word_attempts','english_word_forms','english_word_questions'].includes(table))throw new Error('Unexpected table')
  return query
 })
})
async function request(body:unknown){let output='';const response={statusCode:200,setHeader:vi.fn(),end:(text='')=>{output=text}}
 await handler({method:'POST',body} as Parameters<typeof handler>[0],response as unknown as Parameters<typeof handler>[1])
 return {status:response.statusCode,body:output?JSON.parse(output):null}
}
it('authenticates the teacher before accessing account progress',async()=>{
 mock.rpc.mockResolvedValue({data:{host:false},error:null})
 expect((await request({session:'room',hostSecret:secret,previous:'',lesson:6})).status).toBe(400)
 expect(mock.from).not.toHaveBeenCalled()
})
it('selects from the chosen learner account and registers the same question sent to both screens',async()=>{
 mock.rpc.mockImplementation(async(action:string,args:Record<string,unknown>)=>{
  if(args.p_action==='state')return {data:{id:'room',host:true,turn:null,members:[{id:'student',active:true,turns:0,lastSeen:new Date().toISOString()}]},error:null}
  expect(action).toBe('english_classroom');expect(args.p_action).toBe('adaptive-next')
  return {data:{id:'room',turn:{question:(args.p_payload as Record<string,unknown>).question}},error:null}
 })
 const result=await request({session:'room',hostSecret:secret,previous:'',lesson:6})
 expect(result.status).toBe(200)
 const selected=mock.rpc.mock.calls.at(-1)![1].p_payload
 expect(selected.learner).toBe('student')
 expect(result.body.turn.question.id).toBe(selected.question.id)
 expect(selected.question.document.english).not.toMatch(/banana|apple/i)
 expect(mock.upsert.mock.calls.some(([record])=>record.id===selected.question.id&&record.credit_sentence===selected.question.credit)).toBe(true)
},30000)

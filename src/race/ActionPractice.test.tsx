import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
vi.mock('./GeneratedPractice',()=>({default:({level,userId}:{level:number;userId?:string})=><div data-level={level} data-user={userId}>Shared progression</div>}))
import ActionPractice from './ActionPractice'
it('routes every action level through the account-wide progression engine',()=>{
 for(const level of [4,5,6] as const){const html=renderToStaticMarkup(<ActionPractice level={level} userId="peta" onLevel={()=>{}}/>);expect(html).toContain('Shared progression');expect(html).toContain(`data-level="${level}"`);expect(html).toContain('data-user="peta"')}
})

import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import {connectEnglishLearner} from './handler.ts'

const url=Deno.env.get('SUPABASE_URL')!
const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors,status:204})
 const respond=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}})
 if(req.method!=='POST')return respond(405,{error:'Use POST'})
 const token=req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1]
 if(!token)return respond(401,{error:'Sign in required'})
 try{
  const result=await connectEnglishLearner(token,{
   authenticate:async jwt=>{const {data,error}=await admin.auth.getUser(jwt);return error?null:data.user?.id??null},
   linkedLearner:async source=>{
    const {data,error}=await admin.from('english_learner_account_links').select('learner_user_id').eq('source_user_id',source).maybeSingle()
    if(error)throw error
    return data?.learner_user_id??null
   },
   issueSession:async target=>{
    const {data:account,error}=await admin.auth.admin.getUserById(target)
    if(error||!account.user?.email)return null
    const {data:link,error:linkError}=await admin.auth.admin.generateLink({type:'magiclink',email:account.user.email})
    if(linkError||!link.properties?.hashed_token)return null
    const auth=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
    const {data,error:sessionError}=await auth.auth.verifyOtp({token_hash:link.properties.hashed_token,type:'email'})
    if(sessionError||data.session?.user.id!==target)return null
    return {access_token:data.session.access_token,refresh_token:data.session.refresh_token}
   },
  })
  return respond(result.status,result.body)
 }catch{return respond(503,{error:'Could not connect the learner profile. Please retry.'})}
})

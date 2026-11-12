export type LearnerSessionDependencies = {
 authenticate:(token:string)=>Promise<string|null>
 linkedLearner:(source:string)=>Promise<string|null>
 issueSession:(target:string)=>Promise<{access_token:string;refresh_token:string}|null>
}

/** The target always comes from the administrator-owned link, never request JSON. */
export async function connectEnglishLearner(token:string,deps:LearnerSessionDependencies){
 const source=await deps.authenticate(token)
 if(!source)return {status:401,body:{error:'Sign in required'}}
 const target=await deps.linkedLearner(source)
 if(!target)return {status:200,body:{linked:false,learner_id:source}}
 const session=await deps.issueSession(target)
 if(!session)return {status:503,body:{error:'Could not connect the learner profile. Please retry.'}}
 return {status:200,body:{linked:true,learner_id:target,...session}}
}

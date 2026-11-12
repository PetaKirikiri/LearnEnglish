import assert from 'node:assert/strict'
/** Small assertion adapter shared by Vitest and the standalone local long walk. */
export function expect(actual:unknown,message?:string){
 const positive={
  toBe:(expected:unknown)=>assert.equal(actual,expected,message),
  toEqual:(expected:unknown)=>assert.deepEqual(actual,expected,message),
  toBeDefined:()=>assert.notEqual(actual,undefined,message),
  toContain:(expected:unknown)=>assert((actual as unknown[]).includes(expected),message),
  toBeGreaterThan:(expected:number)=>assert((actual as number)>expected,message),
  toBeLessThanOrEqual:(expected:number)=>assert((actual as number)<=expected,message),
 }
 return {...positive,not:{toContain:(expected:unknown)=>assert(!(actual as unknown[]).includes(expected),message)}}
}

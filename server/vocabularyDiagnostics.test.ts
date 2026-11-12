import {expect,it} from 'vitest'
import type {IncomingMessage} from 'node:http'
import {localDiagnosticRequest} from './vocabularyDiagnostics'
const request=(host:string,address:string,origin?:string)=>({headers:{host,origin},socket:{remoteAddress:address}} as IncomingMessage)
it('allows only this computer and the same origin, never a public or LAN caller',()=>{
 expect(localDiagnosticRequest(request('127.0.0.1:5197','127.0.0.1','http://127.0.0.1:5197'))).toBe(true)
 expect(localDiagnosticRequest(request('localhost:5197','::1'))).toBe(true)
 expect(localDiagnosticRequest(request('127.0.0.1:5197','192.168.1.10'))).toBe(false)
 expect(localDiagnosticRequest(request('attacker.example:5197','127.0.0.1'))).toBe(false)
 expect(localDiagnosticRequest(request('127.0.0.1:5197','127.0.0.1','https://attacker.example'))).toBe(false)
 expect(localDiagnosticRequest(request('127.0.0.1:5197','127.0.0.1','http://127.0.0.1:6000'))).toBe(false)
})

export default function IdentificationPracticeInvite({students=0,ready=false}:{students?:number;ready?:boolean}){
 return <section className="su-join"><div className="su-qr"><h1>Lesson 6 · What is this?</h1><p role="status">{ready?`Practice is open on ${students} joined ${students===1?'phone':'phones'}.`:'Opening practice on joined phones…'}</p></div></section>
}

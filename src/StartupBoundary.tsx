import {Component,type ReactNode} from 'react'
export default class StartupBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false}
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<main style={{minHeight:'100dvh',display:'grid',placeContent:'center',gap:16,padding:24,textAlign:'center',fontFamily:'system-ui',background:'#edf4ff',color:'#18395e'}}><h1>Couldn’t open the page</h1><p>เปิดหน้าไม่สำเร็จ กรุณาลองอีกครั้ง</p><button onClick={()=>{const url=new URL(location.href);url.searchParams.set('reload',String(Date.now()));location.replace(url.href)}} style={{padding:16,fontSize:18,background:'#ffdf49',border:'2px solid #d3aa20',borderRadius:14}}>Try again · ลองอีกครั้ง</button></main>:this.props.children}
}

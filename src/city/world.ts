export const WORLD = {width:1672,height:941}
export const places = [
 {id:'hotel',name:'hotel',thai:'โรงแรม',x:355,y:327},
 {id:'bank',name:'bank',thai:'ธนาคาร',x:850,y:333},
 {id:'gym',name:'gym',thai:'ยิม',x:1335,y:329},
 {id:'school',name:'school',thai:'โรงเรียน',x:350,y:573},
 {id:'clinic',name:'clinic',thai:'คลินิก',x:1410,y:589},
 {id:'bookstore',name:'bookstore',thai:'ร้านหนังสือ',x:300,y:889},
 {id:'toilet',name:'toilet',thai:'ห้องน้ำ',x:815,y:887},
 {id:'padel',name:'padel court',thai:'สนามพาเดล',x:1330,y:885},
] as const
export type PlaceId = typeof places[number]['id']
export type Direction = 'up'|'down'|'left'|'right'
export type CityPlayer = {id:string;name:string;avatar:number;x:number;y:number;dx:number;dy:number;facing:Direction;online:boolean;speech:string;speechUntil:number;found:boolean;inputAck?:number}
export type CityState = {code:string;players:CityPlayer[];target:PlaceId;paused:boolean;now:number}
export type CityCredentials = {code:string;token:string;role:'host'|'player';playerId?:string}
export const playerColors = ['#ed454b','#9858d4','#187bef','#f6b922','#e9699b','#0ca292','#f5802d','#4862c4']
// Ground collision rectangles follow the approved map. Roads and front doors stay open.
const blocks = [[108,0,425,297],[683,0,337,309],[1155,0,450,308],[15,356,515,188],[675,366,340,188],[1185,363,455,195],[0,631,503,220],[685,657,310,196],[1107,637,520,216]]
export function canWalk(x:number,y:number){
 return x>=20&&x<=WORLD.width-20&&y>=24&&y<=WORLD.height-20&&!blocks.some(([bx,by,w,h])=>x>bx-8&&x<bx+w+8&&y>by-5&&y<by+h+5)
}
export function direction(x:number,y:number):Direction{return Math.abs(x)>Math.abs(y)?x<0?'left':'right':y<0?'up':'down'}
export function movePlayer(player:CityPlayer,seconds:number){
 const length=Math.hypot(player.dx,player.dy), divisor=Math.max(1,length)
 const dx=player.dx/divisor,dy=player.dy/divisor
 // Substeps prevent crossing a building on a delayed tick.
 const steps=Math.max(1,Math.ceil(seconds/.025)), distance=120*seconds/steps
 for(let i=0;i<steps;i++){
  if(canWalk(player.x+dx*distance,player.y))player.x+=dx*distance
  if(canWalk(player.x,player.y+dy*distance))player.y+=dy*distance
 }
 if(length>.08)player.facing=direction(dx,dy)
}
export function atDestination(player:CityPlayer,target:PlaceId){const place=places.find(p=>p.id===target)!;return Math.hypot(player.x-place.x,player.y-place.y)<72}

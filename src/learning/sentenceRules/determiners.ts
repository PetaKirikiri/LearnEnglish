import {possessiveFor} from './possessives'
/** Demonstratives agree in number; introductory some is plural or uncountable. */
export function determinerAgrees(word:string,plural:boolean,mass=false){
 if(['this','that'].includes(word))return !plural
 if(['these','those'].includes(word))return plural&&!mass
 if(word==='some')return plural||mass
 if(['a','an'].includes(word))return !plural&&!mass
 return !!possessiveFor(word)||['the','my','your','his','her','our','their'].includes(word)
}

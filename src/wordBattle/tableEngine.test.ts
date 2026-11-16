import {expect,it} from 'vitest'
import {emptyBoard,production,merge,move} from './tableEngine'
import type {Tile} from './tableEngine'
const tile=(word:Tile['word'],id:number,rank=0):Tile=>({word,id,rank})
it('scores separate connected groups and penalises stranded words',()=>{
 const b=emptyBoard();b[0]=tile('the',1);b[1]=tile('dog',2);b[3]=tile('quickly',3)
 expect(production(b).net).toBe(0)
 expect(production(b).values.slice(0,4)).toEqual([1,1,0,-1])
 b[2]=tile('is',4);b[3]=tile('running',5)
 expect(production(b).net).toBe(5)
})
it('gaps split phrases and groups can continue across rows',()=>{
 const b=emptyBoard();b[6]=tile('the',1);b[7]=tile('dog',2)
 expect(production(b).net).toBe(1)
 b[6]=null;b[7]=null;b[0]=tile('the',1);b[1]=tile('dog',2);b[3]=tile('a',3);b[4]=tile('cat',4)
 expect(production(b).groups).toHaveLength(2);expect(production(b).net).toBe(2)
})
it('merges three copies and cascades silver into gold without mutating input',()=>{
 const b=emptyBoard();b[0]=tile('dog',1);b[1]=tile('dog',2);b[2]=tile('dog',3);b[3]=tile('dog',4,1);b[4]=tile('dog',5,1)
 const result=merge(b);expect(result.filter(Boolean)).toHaveLength(1);expect(result[0]?.rank).toBe(2);expect(b[0]?.rank).toBe(0)
})
it('moves and swaps words without losing cards',()=>{
 const b=emptyBoard();b[0]=tile('the',1);b[1]=tile('dog',2)
 expect(move(b,0,1)[1]?.word).toBe('the');expect(move(b,0,4)[4]?.word).toBe('the');expect(b[0]?.word).toBe('the')
})

it('scores a full coordinated sentence across both rows',()=>{const b=emptyBoard();'the small dog is running and the big fish is walking'.split(' ').forEach((word,i)=>{b[i]=tile(word,i)});expect(production(b).values.slice(0,11)).toEqual(Array(11).fill(1))})

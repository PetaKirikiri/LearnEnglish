import { evaluate, words, nouns, actions, adjectives, functionWords } from './wordGrammar'
import type { Word } from './wordGrammar'
export type Tile = { id: number; word: Word; rank: number }
export type Board = (Tile | null)[]
export const emptyBoard = (): Board => Array.from({ length: 14 }, () => null)
export function production(board: Board) {
  const values = Array<number>(14).fill(0)
  const groups: { text: string; income: number }[] = []
  let i = 0
  while(i < 14) {
    if(!board[i]) {i++;continue}
    const start=i
    while(i<14&&board[i])i++
    const cards=board.slice(start,i) as Tile[]
    const result=evaluate(cards.map(card=>card.word))
    const income=result.valid?Math.max(1,Math.floor(result.score/4))+cards.reduce((n,c)=>n+c.rank,0):-cards.length
    for(let j=start;j<i;j++)values[j]=result.valid?1:-1
    groups.push({text:cards.map(card=>card.word).join(' '),income})
  }
  return { values, groups, net: groups.reduce((n, group) => n + group.income, 0) }
}
export function merge(board: Board): Board {
  const next = [...board]
  for (let rank = 0; rank < 2; rank++) for (const word of words) {
    let matches = next.map((card, i) => card?.word === word && card.rank === rank ? i : -1).filter(i => i >= 0)
    while (matches.length >= 3) {
      const [a, b, c] = matches
      next[a] = { ...next[a]!, rank: rank + 1 }; next[b] = null; next[c] = null
      matches = matches.slice(3)
    }
  }
  return next
}
export function move(board: Board, from: number, to: number): Board {
  if (!board[from] || from < 0 || from >= 14 || to < 0 || to >= 14) return board
  const next = [...board]; [next[from], next[to]] = [next[to], next[from]]
  return next
}
export function offers(tier:number,nextId:()=>number,board:Board=emptyBoard()):Tile[]{
 const pick=<T,>(pool:readonly T[]):T=>pool[Math.floor(Math.random()*pool.length)]
 const onTable=board.filter((card):card is Tile=>!!card)
 const support=['the','a','is','are','am','and','to','at','in','on',...onTable.map(card=>card.word)]
 const pools=[functionWords,nouns.map(noun=>noun.word),[...actions.map(action=>action.word),...adjectives],support]
 return pools.map(pool=>({id:nextId(),word:pick(pool),rank:tier>=3&&Math.random()<.08?2:tier>=2&&Math.random()<.2?1:0}))
}

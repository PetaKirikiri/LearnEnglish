import type {Plugin} from 'vite'
import {handlerWith,memoryStore} from './wordBattleCloud'
export function wordBattlePlugin():Plugin{return{name:'word-battle-rooms',configureServer(server){const handler=handlerWith(memoryStore());server.middlewares.use('/api/word-battle',handler)}}}

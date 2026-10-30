import {writeFileSync} from 'node:fs'
import {numberCatalogue} from '../src/race/numberCatalogue'
const quote=(value:string)=>`'${value.replaceAll("'","''")}'`
writeFileSync('supabase/migrations/20261030000200_number_recall_catalogue.sql',`-- Generated from the shared, blueprint-validated classroom catalogue.\ninsert into public.english_number_items(word,plural,lesson) values\n${numberCatalogue.map(item=>`(${quote(item.word)},${item.pluralForm},${item.lesson})`).join(',\n')}\non conflict(word) do update set plural=excluded.plural,lesson=excluded.lesson;\n`)
console.log(`${numberCatalogue.length} eligible word forms; lessons ${[1,2,3].map(n=>`${n}: ${numberCatalogue.filter(item=>item.lesson===n).length}`).join(', ')}`)

import type {WordMeaning} from './blueprints'
/** Reviewed senses that cannot be safely inferred from a browsing category. */
export const meaningProfiles:Readonly<Record<string,WordMeaning>>={
 thought:{kind:'abstract'},idea:{kind:'abstract'},happiness:{kind:'abstract'},advice:{kind:'abstract',countability:'mass'},
 taxi:{kind:'physical-object'},
 beach:{kind:'place',locationPrepositions:['at','on']},
 airport:{kind:'place',locationPrepositions:['at','in']},
 shop:{kind:'place',locationPrepositions:['at','in']},
 pharmacy:{kind:'place',locationPrepositions:['at','in']},
 hospital:{kind:'place',locationPrepositions:['at','in']},
 supermarket:{kind:'place',locationPrepositions:['at','in']},
 market:{kind:'place',locationPrepositions:['at','in']},
 cafe:{kind:'place',locationPrepositions:['at','in']},
 'bus stop':{kind:'place',locationPrepositions:['at']},
 'car park':{kind:'place',locationPrepositions:['at','in']},
 entrance:{kind:'place',locationPrepositions:['at']},exit:{kind:'place',locationPrepositions:['at']},
 atm:{kind:'physical-object',roles:['destination'],locationPrepositions:['at']},
 lift:{kind:'physical-object',roles:['destination'],locationPrepositions:['at','in']},
 'swimming pool':{kind:'place',locationPrepositions:['at','in']},
}

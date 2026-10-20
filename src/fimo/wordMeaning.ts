import { wordIcons, type WordIcon } from './wordIconCatalogue'

export const contextualIcons: Record<string, WordIcon> = {
  'the-shared': wordIcons.the,
  'is-location': { asset: 'is-location', description: 'Link the subject to a location.' },
  'be-ongoing': { symbol: 'time', value: 'now', cue: 'ongoing', description: 'Be + -ing: an action in progress.' },
  'be-passive': { symbol: 'relation', value: 'receive', description: 'Be with a completed form: the subject receives the action or has its resulting state.' },
  'have-completed': { symbol: 'time', value: 'done', description: 'Have/has + completed verb form: connected to now.' },
  'have-request': { asset: 'hand', cue: 'question', description: 'A polite request to receive something.' },
  'at-time': { asset: 'clock', cue: 'yes', description: 'At a particular clock time.' },
  'in-time': { symbol: 'time', value: 'future', description: 'In a stated amount of time from now.' },
  'on-time': { asset: 'calendar', cue: 'yes', description: 'On a particular day.' },
  'for-duration': { symbol: 'time', value: 'duration', description: 'For a duration.' },
  'to-action': { symbol: 'relation', value: 'action', description: 'To connects to the next action: to play, to pay.' },
  'to-time': { symbol: 'time', value: 'until', description: 'To the ending time of a range.' },
  'left-remaining': { symbol: 'amount', value: 'remaining', description: 'The amount remaining, not the left-hand direction.' },
  'over-finished': { symbol: 'time', value: 'end', description: 'The activity has ended.' },
  'service-box': { asset: 'court', cue: 'start', description: 'The court area for the serve.' },
  'grip-socks': { asset: 'socks', description: 'Anti-slip grip on socks, not racket grip tape.' },
  'turn-off': { asset: 'light', cue: 'no', description: 'Switch a light or device off.' },
  'turn-on': { asset: 'light', cue: 'yes', description: 'Switch a light or device on.' },
  'take-class': { asset: 'person', secondary: 'mat', cue: 'start', description: 'Participate in a class, not carry an object away.' },
  'changing-room': { asset: 'studio', secondary: 'bag', description: 'A room for changing clothes.' },
  'return-serve': { asset: 'racket', secondary: 'ball', cue: 'return', description: 'Hit the incoming serve back.' },
  'there-exists': { symbol: 'relation', value: 'exists', description: 'There are: introduce something that exists, not a distant location.' },
  'how-many': { symbol: 'amount', value: 'many', cue: 'question', description: 'Ask about the number of items.' },
  'how-long': { symbol: 'time', value: 'duration', cue: 'question', description: 'Ask about duration.' },
  'how-often': { symbol: 'time', value: 'often', cue: 'question', description: 'Ask about frequency.' },
  'credit-balance': { asset: 'money', secondary: 'clipboard', description: 'Credit kept on account for a future booking, not a payment card.' },
}

const numbers = '(?:one|two|three|four|five|six|seven|eight|nine|ten|fifteen|thirty|fifty|\\d+)'
const duration = new RegExp(`^\\s+(?:${numbers}|an?|the)\\s+(?:minutes?|hours?|days?|weeks?|months?)\\b`, 'i')
export function wordMeaning(word: string, followingText: string, precedingText = ''): string | undefined {
  const key = word.toLowerCase()
  if (key === 'the') return 'the-shared'
  if (['is','am','are'].includes(key)) {
    if (/^\s+(?:not\s+)?[a-z]+ing\b/i.test(followingText)) return 'be-ongoing'
    if (/^\s+(?:not\s+)?(?:booked|sold|included)\b/i.test(followingText)) return 'be-passive'
    if (/^\s+(?:not\s+)?(?:on|at|in|by|inside|outside|here|there|upstairs|downstairs)\b/i.test(followingText)) return 'is-location'
  }
  if (['have','has'].includes(key)) {
    if (/^\s+(?:not\s+)?(?:arrived|paid|prepared|cleaned|started|changed|checked|replaced|stopped|booked|sent)\b/i.test(followingText)) return 'have-completed'
    if (/\bmay\s+i\s*$/i.test(precedingText)) return 'have-request'
  }
  if (key === 'at' && new RegExp(`^\\s+${numbers}\\b`, 'i').test(followingText)) return 'at-time'
  if (key === 'in' && duration.test(followingText)) return 'in-time'
  if (key === 'on' && /^\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(followingText)) return 'on-time'
  if (key === 'for' && duration.test(followingText)) return 'for-duration'
  if (key === 'to') {
    if (new RegExp(`^\\s+${numbers}\\b`, 'i').test(followingText)) return 'to-time'
    if (/^\s+(?:play|pay|join|cancel|book|take|extend|move|find|buy|hire|explain|check|delay|wear|use|prepare|ask|leave)\b/i.test(followingText)) return 'to-action'
  }
  if (key === 'left' && /\b(?:places?|classes?)\s*$/i.test(precedingText)) return 'left-remaining'
  if (key === 'over' && /\b(?:is|are)\s*$/i.test(precedingText)) return 'over-finished'
  if (['service','box'].includes(key) && (key === 'service' && /^\s+box\b/i.test(followingText) || key === 'box' && /\bservice\s*$/i.test(precedingText))) return 'service-box'
  if (key === 'grip' && /^\s+socks\b/i.test(followingText)) return 'grip-socks'
  if (['on','off'].includes(key) && /\bturn(?:\s+the\s+lights)?\s*$/i.test(precedingText)) return key === 'on' ? 'turn-on' : 'turn-off'
  if (key === 'take' && /^\s+(?:a|the)\s+class\b/i.test(followingText)) return 'take-class'
  if (key === 'changing' && /^\s+room\b/i.test(followingText)) return 'changing-room'
  if (key === 'return' && /^\s+the\s+serve\b/i.test(followingText)) return 'return-serve'
  if (key === 'there' && (/^\s+(?:is|are)\b/i.test(followingText) || /^\s*(?:is|are)\s*$/i.test(precedingText))) return 'there-exists'
  if (key === 'credit' && !/^\s+card\b/i.test(followingText)) return 'credit-balance'
  if (key === 'how') {
    const modifier = followingText.match(/^\s+(many|long|often)\b/i)?.[1].toLowerCase()
    if (modifier) return `how-${modifier}`
  }
  return wordIcons[key] ? key : undefined
}

export function iconForMeaning(meaning: string): WordIcon | undefined {
  return contextualIcons[meaning] ?? wordIcons[meaning]
}

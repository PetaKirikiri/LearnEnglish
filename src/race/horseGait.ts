export type HorseMood = 'confident' | 'steady' | 'struggling'
export const horseMoods: HorseMood[] = ['confident', 'steady', 'struggling']
export const horseStyles = {
  confident: { label: 'Fast correct', speed: 16, cadence: 1.15 },
  steady: { label: 'Slow correct', speed: 11, cadence: .9 },
  struggling: { label: 'Wrong / missed', speed: 4, cadence: .45 },
} as const

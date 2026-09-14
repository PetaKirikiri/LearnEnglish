export type IconName = 'back' | 'close' | 'sound' | 'pause' | 'play' | 'flag' | 'check' | 'arrow' | 'book' | 'trophy' | 'grid'
const paths: Record<IconName, string> = {
  back: 'm14 6-6 6 6 6M8 12h12', close: 'm6 6 12 12M6 18 18 6',
  sound: 'M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  pause: 'M8 5v14M16 5v14', play: 'm8 5 11 7-11 7V5Z',
  flag: 'M5 21V4m0 0c5-5 9 5 14 0v10c-5 5-9-5-14 0', check: 'm5 12 4 4L19 6',
  arrow: 'M4 12h16m-6-6 6 6-6 6', book: 'M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15',
  trophy: 'M7 3h10v6a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 2v6m-4 1h8',
  grid: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
}
export default function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>
}

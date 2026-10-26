export type RacePhase = 'lobby' | 'answering' | 'finished'
export type RacePlayer = { id: string; name: string; lane: number; metres: number; speed: number; answered: boolean; streak?: number }
export type RaceView = {
  id: string; run: number; stageId: string; phase: RacePhase; round: number; finish: number; serverNow: number;
  title: string; players: RacePlayer[]; opensAt: number; closesAt: number; motionAt: number;
  question?: { id: string; audioUrl?: string; english?: string; choices: string[]; correct?: number };
  me?: { id: string; choice?: number }; joinUrl?: string; questionIds?: string[];
}
export type RaceCredential = { room: string; token: string }

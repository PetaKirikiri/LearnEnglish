import { movePlayer, type CityPlayer } from './world'

export type MoveCommand = { seq: number; x: number; y: number; seconds: number }

/** Predict locally, then replay only movement the host has not acknowledged. */
export class CityPrediction {
 player: CityPlayer | null = null
 pending: MoveCommand[] = []
 private sequence = 0
 private sent = 0
 private input = { x: 0, y: 0 }
 private offset = { x: 0, y: 0 }
 private lastSnapshot = -Infinity

 reconcile(authority: CityPlayer, snapshotTime: number, active: boolean) {
  if (snapshotTime < this.lastSnapshot && authority.id === this.player?.id) return
  const previous = this.display()
  const changed = this.player?.id !== authority.id
  const ack = authority.inputAck ?? 0
  if (changed || !active) { this.pending = []; this.input = { x: 0, y: 0 } }
  this.sequence = Math.max(changed ? 0 : this.sequence, ack)
  this.sent = Math.max(changed ? 0 : this.sent, ack)
  this.pending = this.pending.filter(command => command.seq > ack)
  this.player = { ...authority }
  for (const command of this.pending) this.apply(command)
  this.player.dx = active ? this.input.x : 0
  this.player.dy = active ? this.input.y : 0
  this.lastSnapshot = snapshotTime
  // Correct small network differences visually, without changing the collision position.
  const distance = previous ? Math.hypot(previous.x - this.player.x, previous.y - this.player.y) : Infinity
  this.offset = !changed && active && previous && distance < 100
   ? { x: previous.x - this.player.x, y: previous.y - this.player.y }
   : { x: 0, y: 0 }
 }
 setInput(x: number, y: number) {
  this.input = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) }
  if (this.player) { this.player.dx = this.input.x; this.player.dy = this.input.y }
  if (x === 0 && y === 0 && this.player) this.queue(0)
 }
 step(seconds: number, active: boolean) {
  const dt = Math.min(.05, Math.max(0, seconds))
  if (active && this.player && this.pending.length < 120 && Math.hypot(this.input.x, this.input.y) > 0) this.queue(dt)
  const decay = Math.exp(-18 * dt)
  this.offset.x *= decay; this.offset.y *= decay
 }
 unsent(): MoveCommand[] {
  const commands = this.pending.filter(command => command.seq > this.sent).slice(0, 12)
  if (commands.length) this.sent = commands[commands.length - 1].seq
  return commands
 }
 display(): CityPlayer | null {
  return this.player ? { ...this.player, x: this.player.x + this.offset.x, y: this.player.y + this.offset.y } : null
 }
 private queue(seconds: number) {
  const command = { seq: ++this.sequence, ...this.input, seconds }
  this.pending.push(command); this.apply(command)
 }
 private apply(command: MoveCommand) {
  if (!this.player) return
  this.player.dx = command.x; this.player.dy = command.y
  movePlayer(this.player, command.seconds)
 }
}

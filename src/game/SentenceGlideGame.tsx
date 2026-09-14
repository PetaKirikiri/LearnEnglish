import Phaser from 'phaser'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Gate = {
  left: string
  right: string
  answer: string
}

const gates: readonly Gate[] = [
  { left: 'A', right: 'The', answer: 'The' },
  { left: 'train', right: 'bus', answer: 'train' },
  { left: 'are', right: 'is', answer: 'is' },
  { left: 'reading', right: 'passing', answer: 'passing' },
  { left: 'over', right: 'under', answer: 'over' },
  { left: 'my', right: 'your', answer: 'your' },
  { left: 'home', right: 'head', answer: 'head' },
]

const choiceTimeMs = 5000

class GlideScene extends Phaser.Scene {
  private flyer!: Phaser.GameObjects.Container
  private squirrel!: Phaser.GameObjects.Sprite
  private trail!: Phaser.GameObjects.Graphics
  private speedLines!: Phaser.GameObjects.Graphics
  private distanceText!: Phaser.GameObjects.Text
  private distance = 0
  private speed = 72
  private lift = 0
  private flightState: 'flying' | 'finished' | 'crashed' | 'stopped' = 'flying'
  private readonly onDistance: (distance: number) => void

  constructor(onDistance: (distance: number) => void) {
    super('sentence-glide')
    this.onDistance = onDistance
  }

  preload() {
    this.load.image('flying-squirrel-frames', '/game/flying-squirrel-frames.png')
  }

  create() {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor('#60a5fa')

    for (let index = 0; index < 16; index += 1) {
      const radius = Phaser.Math.Between(10, 32)
      const cloud = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(80, height - 40),
        radius,
        0xffffff,
        Phaser.Math.FloatBetween(0.18, 0.42),
      )
      cloud.setData('parallax', 0.32 + radius / 30)
    }

    this.speedLines = this.add.graphics()
    this.trail = this.add.graphics()
    const squirrelTexture = this.textures.get('flying-squirrel-frames')
    const source = squirrelTexture.getSourceImage() as HTMLImageElement
    const frameWidth = Math.floor(source.width / 4)
    const frameTop = Math.floor(source.height * 0.16)
    const frameHeight = Math.floor(source.height * 0.68)
    for (let index = 0; index < 4; index += 1) {
      squirrelTexture.add(`glide-${index}`, 0, index * frameWidth, frameTop, frameWidth, frameHeight)
    }
    this.anims.create({
      key: 'squirrel-flap',
      frames: [0, 1, 2, 1, 0].map((index) => ({ key: 'flying-squirrel-frames', frame: `glide-${index}` })),
      frameRate: 11,
      repeat: 0,
    })
    this.anims.create({
      key: 'squirrel-boost',
      frames: [0, 1, 2, 3, 2, 1, 0].map((index) => ({ key: 'flying-squirrel-frames', frame: `glide-${index}` })),
      frameRate: 15,
      repeat: 0,
    })
    this.squirrel = this.add.sprite(0, 0, 'flying-squirrel-frames', 'glide-0').setDisplaySize(150, 112)
    this.flyer = this.add.container(width * 0.28, height * 0.52, [this.squirrel])

    this.distanceText = this.add.text(width - 18, height - 18, '0 m', {
      color: '#ffffff',
      fontFamily: 'system-ui',
      fontSize: '20px',
      fontStyle: 'bold',
      stroke: '#1e3a8a',
      strokeThickness: 5,
    }).setOrigin(1, 1)
  }

  applyChoice(outcome: 'correct' | 'wrong' | 'too-fast', responseMs: number, streak: number) {
    if (this.flightState !== 'flying') return
    if (outcome === 'correct') {
      const previousSpeed = this.speed
      const responseFactor = responseMs <= 1500 ? 1.3 : responseMs <= 3000 ? 1 : 0.65
      const streakMultiplier = 1 + Math.min(5, Math.max(0, streak - 1)) * 0.28
      const boost = 26 * responseFactor * streakMultiplier
      this.speed = Math.min(420, this.speed + boost)
      this.lift = -45 - Math.min(streak, 5) * 2
      this.squirrel.play(streak >= 4 ? 'squirrel-boost' : 'squirrel-flap', true)
      this.cameras.main.flash(90, 255, 180, 55, false)
      this.cameras.main.shake(70 + streak * 12, 0.003 + streak * 0.001)
      const crossedPowerTier = [170, 270, 370].some((tier) => previousSpeed < tier && this.speed >= tier)
      if (crossedPowerTier) this.emitPowerRing()
    } else {
      this.speed = 72
      this.lift = 85
      this.cameras.main.shake(120, 0.009)
    }
  }

  private emitPowerRing() {
    const ring = this.add.ellipse(this.flyer.x - 8, this.flyer.y, 28, 64, 0xffffff, 0)
      .setStrokeStyle(5, 0xfef08a, 0.9)
    this.tweens.add({
      targets: ring,
      x: this.flyer.x - 320,
      scaleX: 3.4,
      scaleY: 2.2,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    })
  }

  finishFlight() {
    this.flightState = 'finished'
    this.speed = Math.max(this.speed, 220)
    this.lift = -150
    this.cameras.main.flash(180, 255, 220, 70, false)
    this.time.delayedCall(900, () => {
      if (this.flightState === 'finished') {
        this.flightState = 'stopped'
        this.speed = 0
        this.lift = 0
      }
    })
  }

  crash() {
    this.flightState = 'crashed'
    this.speed = Math.max(35, this.speed * 0.45)
    this.lift = 230
    this.cameras.main.shake(450, 0.025)
    this.cameras.main.flash(180, 255, 70, 70, false)
  }

  update(_time: number, delta: number) {
    const seconds = delta / 1000
    const { width, height } = this.scale
    if (this.flightState === 'stopped') return
    if (this.flightState !== 'crashed' || this.flyer.y < height - 35) {
      this.distance += this.speed * seconds
    }
    const minimumSpeed = this.flightState === 'flying' ? 65 : 0
    this.speed = Math.max(minimumSpeed, this.speed - (this.flightState === 'flying' ? 8 : 65) * seconds)
    this.lift += (this.flightState === 'crashed' ? 260 : 75) * seconds
    this.flyer.y = Phaser.Math.Clamp(this.flyer.y + this.lift * seconds, 75, height - 35)
    this.flyer.rotation = this.flightState === 'crashed'
      ? this.flyer.rotation + 5 * seconds
      : Phaser.Math.Clamp(this.lift / 500, -0.18, 0.22)
    if (this.flightState === 'crashed' && this.flyer.y >= height - 35) {
      this.flightState = 'stopped'
      this.speed = 0
      this.lift = 0
    }

    this.children.list.forEach((child) => {
      if (!(child instanceof Phaser.GameObjects.Arc)) return
      const parallax = child.getData('parallax') as number | undefined
      if (!parallax) return
      child.x -= this.speed * parallax * seconds
      if (child.x < -45) {
        child.x = width + Phaser.Math.Between(20, 140)
        child.y = Phaser.Math.Between(80, height - 40)
      }
    })

    const intensity = Phaser.Math.Clamp((this.speed - 72) / 348, 0, 1)
    this.cameras.main.setZoom(1 + intensity * 0.045)
    this.flyer.setScale(1 + intensity * 0.22)

    this.speedLines.clear()
    const lineCount = Math.floor(intensity * 30)
    for (let index = 0; index < lineCount; index += 1) {
      const x = Phaser.Math.Between(0, width)
      const y = Phaser.Math.Between(55, height - 25)
      const length = Phaser.Math.Between(20, 45) + intensity * Phaser.Math.Between(80, 230)
      const color = intensity > 0.72 && index % 4 === 0 ? 0xfef08a : 0xffffff
      this.speedLines.lineStyle(1 + intensity * 2.5, color, 0.12 + intensity * 0.5)
      this.speedLines.beginPath()
      this.speedLines.moveTo(x, y)
      this.speedLines.lineTo(x - length, y)
      this.speedLines.strokePath()
    }

    this.trail.clear()
    const dots = Math.max(4, Math.round(this.speed / 18))
    for (let index = 0; index < dots; index += 1) {
      const gap = 12 + index * (8 + this.speed / 80)
      const alpha = 0.9 - index / (dots + 2)
      this.trail.fillStyle(index < 4 ? 0xfef08a : 0xffffff, alpha)
      this.trail.fillCircle(this.flyer.x - gap, this.flyer.y + Phaser.Math.Between(-4, 4), Math.max(2, 5 - index * 0.25))
    }

    const rounded = Math.floor(this.distance)
    this.distanceText.setText(`${rounded} m`)
    this.onDistance(rounded)
  }
}

export default function SentenceGlideGame({ onExit }: { onExit: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<GlideScene | null>(null)
  const touchStartRef = useRef<number | null>(null)
  const gateStartedAtRef = useRef(0)
  const [gateIndex, setGateIndex] = useState(0)
  const [words, setWords] = useState<string[]>([])
  const [distance, setDistance] = useState(0)
  const [combo, setCombo] = useState(0)
  const [result, setResult] = useState<'playing' | 'success' | 'crashed'>('playing')
  const [timeLeft, setTimeLeft] = useState(choiceTimeMs)
  const [roundId, setRoundId] = useState(0)

  const currentGate = gates[gateIndex]
  const sentence = useMemo(() => words.join(' '), [words])

  useEffect(() => {
    if (!mountRef.current) return
    const scene = new GlideScene((nextDistance) => setDistance(nextDistance))
    sceneRef.current = scene
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: mountRef.current,
      width: mountRef.current.clientWidth || 390,
      height: mountRef.current.clientHeight || 844,
      transparent: false,
      render: {
        antialias: true,
        antialiasGL: true,
        pixelArt: false,
        roundPixels: false,
      },
      scene,
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    })
    return () => {
      sceneRef.current = null
      game.destroy(true)
    }
  }, [roundId])

  useEffect(() => {
    if (result !== 'playing') return
    const deadline = Date.now() + choiceTimeMs
    gateStartedAtRef.current = Date.now()
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, deadline - Date.now())
      setTimeLeft(remaining)
      if (remaining === 0) {
        window.clearInterval(timer)
        sceneRef.current?.crash()
        setCombo(0)
        setResult('crashed')
      }
    }, 50)
    return () => window.clearInterval(timer)
  }, [gateIndex, result, roundId])

  const choose = useCallback((word: string) => {
    if (result !== 'playing' || !currentGate) return
    const correct = word === currentGate.answer
    const responseMs = Date.now() - gateStartedAtRef.current
    const tooFast = responseMs < 400
    const nextCombo = correct && !tooFast ? combo + 1 : 0
    sceneRef.current?.applyChoice(correct && !tooFast ? 'correct' : tooFast ? 'too-fast' : 'wrong', responseMs, nextCombo)
    setWords([...words, word])
    setCombo(nextCombo)
    setTimeLeft(choiceTimeMs)
    if (gateIndex === gates.length - 1) {
      sceneRef.current?.finishFlight()
      setResult('success')
    } else {
      setGateIndex((index) => index + 1)
    }
  }, [combo, currentGate, gateIndex, result, words])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat || result !== 'playing' || !currentGate) return
      if (event.key === '1') choose(currentGate.left)
      if (event.key === '2') choose(currentGate.right)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [choose, currentGate, result])

  function restart() {
    setGateIndex(0)
    setWords([])
    setCombo(0)
    setDistance(0)
    setResult('playing')
    setTimeLeft(choiceTimeMs)
    setRoundId((value) => value + 1)
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const start = touchStartRef.current
    if (start === null) return
    const change = event.changedTouches[0].clientX - start
    touchStartRef.current = null
    if (Math.abs(change) < 35 || !currentGate) return
    choose(change < 0 ? currentGate.left : currentGate.right)
  }

  return (
    <main
      className="relative h-[100dvh] w-full touch-none overflow-hidden bg-sky-400 text-white"
      onTouchStart={(event) => { touchStartRef.current = event.touches[0].clientX }}
      onTouchEnd={handleTouchEnd}
    >
      <div ref={mountRef} className="absolute inset-0" />

      <button
        type="button"
        aria-label="Exit game"
        onClick={onExit}
        className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 grid h-10 w-10 place-items-center rounded-full bg-slate-950/35 text-xl font-black backdrop-blur-sm"
      >
        ×
      </button>
      <p className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 font-black drop-shadow-md">
        {distance}m
      </p>

      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-slate-950/65 to-transparent px-14 pb-16 pt-[max(1rem,env(safe-area-inset-top))] text-center">
        <p className="text-lg font-black drop-shadow-md sm:text-2xl">รถไฟกำลังวิ่งผ่านเหนือศีรษะของคุณ!</p>
        <p className="mt-1 min-h-6 text-base font-black text-white drop-shadow-md">{sentence || '\u00a0'}</p>
        {result === 'playing' ? (
          <div className="mx-auto mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-white/25">
            <div
              className={`h-full rounded-full transition-[width] duration-75 ${timeLeft < 1500 ? 'bg-red-400' : 'bg-yellow-300'}`}
              style={{ width: `${(timeLeft / choiceTimeMs) * 100}%` }}
            />
          </div>
        ) : null}
      </div>

      {result === 'playing' && currentGate ? (
        <div className="absolute inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-20 flex items-center justify-between gap-3 px-4 sm:px-10">
          <button type="button" onClick={() => choose(currentGate.left)} className="min-w-0 flex-1 rounded-2xl border-2 border-white/80 bg-slate-950/70 px-3 py-4 text-xl font-black shadow-xl backdrop-blur-sm active:scale-95">
            <span className="mr-1 rounded-md bg-white/20 px-2 py-1 text-xs">1</span> {currentGate.left}
          </button>
          <button type="button" onClick={() => choose(currentGate.right)} className="min-w-0 flex-1 rounded-2xl border-2 border-white/80 bg-slate-950/70 px-3 py-4 text-xl font-black shadow-xl backdrop-blur-sm active:scale-95">
            {currentGate.right} <span className="ml-1 rounded-md bg-white/20 px-2 py-1 text-xs">2</span>
          </button>
        </div>
      ) : null}

      {result !== 'playing' ? (
        <div className="absolute inset-0 z-30 grid place-items-center bg-slate-950/35 px-6 backdrop-blur-[2px]">
          <div className="text-center">
            <p className="text-3xl font-black drop-shadow-lg">
              {result === 'success' ? `${distance}m` : `Crashed · ${distance}m`}
            </p>
            <button type="button" onClick={restart} className="mt-5 rounded-full bg-orange-500 px-8 py-4 text-lg font-black text-white shadow-xl active:scale-95">
              Again
            </button>
          </div>
        </div>
      ) : null}
    </main>
  )
}

import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'
import NavBar from './components/NavBar.tsx'
import StatsPanel from './components/StatsPanel.tsx'
import GameView from './components/GameView.tsx'
import type { GameState, Dir } from './components/game/types'
import { buildLevel } from './components/game/levels'
import { tickTimers, movePlayer } from './components/game/engine'

function App() {
  const [gs, setGs] = useState<GameState | null>(null)
  const gsRef = useRef<GameState | null>(null)
  const lastTimeRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const keysPressed = useRef<Set<string>>(new Set())

  const startGame = useCallback((level = 1, prevScore = 0) => {
    const state = buildLevel(level, prevScore)
    gsRef.current = state
    setGs({ ...state })
  }, [])

  useEffect(() => {
    if (gs?.levelClear && !gs.upgrading) {
      const state = gsRef.current!
      state.upgrading = true
      setGs({ ...state })
    }
  }, [gs?.levelClear])

  const applyUpgrade = useCallback((stat: 'hp' | 'atk' | 'def' | 'spd') => {
    if (!gsRef.current) return
    const p = gsRef.current.player
    if (stat === 'hp') { p.maxHp += 10; p.hp = p.maxHp }
    if (stat === 'atk') p.attack += 2
    if (stat === 'def') p.defense += 1
    if (stat === 'spd') p.speed += 1
    startGame(gsRef.current.level + 1, p.score)
  }, [startGame])

  // Continuous movement logic
  useEffect(() => {
    const DIR_MAP: Record<string, Dir> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
      W: 'up', S: 'down', A: 'left', D: 'right',
    }

    const interval = setInterval(() => {
      if (!gsRef.current || gsRef.current.gameOver || gsRef.current.upgrading) return
      
      // Get the last key pressed that is still held
      const activeKeys = Array.from(keysPressed.current).filter(k => DIR_MAP[k])
      if (activeKeys.length > 0) {
        const lastKey = activeKeys[activeKeys.length - 1]
        const dir = DIR_MAP[lastKey]
        if (movePlayer(gsRef.current, dir)) {
          setGs({ ...gsRef.current })
        }
      }
    }, 16) // Check every frame

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault()
        keysPressed.current.add(e.key)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      clearInterval(interval)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Game loop for animations and AI
  useEffect(() => {
    if (!gs) return
    const loop = (now: number) => {
      const dt = lastTimeRef.current ? Math.min(now - lastTimeRef.current, 50) : 16
      lastTimeRef.current = now
      if (gsRef.current && !gsRef.current.gameOver && !gsRef.current.upgrading) {
        tickTimers(gsRef.current, dt)
        setGs({ ...gsRef.current })
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [gs === null])

  return (
    <div className="app-shell">
      <NavBar />
      <StatsPanel player={gs?.player} />
      <GameView 
        gs={gs} 
        onStart={startGame} 
        onMove={() => {}} // Movement now handled in App.tsx via setInterval
        onUpgrade={applyUpgrade}
      />
    </div>
  )
}

export default App

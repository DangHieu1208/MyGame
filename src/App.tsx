import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'
import NavBar from './components/NavBar.tsx'
import StatsPanel from './components/StatsPanel.tsx'
import GameView from './components/GameView.tsx'
import type { GameState, Dir } from './components/game/types'
import { buildLevel } from './components/game/levels'
import { tickTimers, movePlayer, handleSpaceAction } from './components/game/engine'
import { sounds } from './components/game/SoundManager'

function App() {
  const [gs, setGs] = useState<GameState | null>(null)
  const gsRef = useRef<GameState | null>(null)
  const lastTimeRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const keysPressed = useRef<Set<string>>(new Set())

  const startGame = useCallback((level = 1, prevScore = 0) => {
    const state = buildLevel(level, prevScore)
    // Persist skin, volume AND upgraded attributes across levels
    if (gsRef.current) {
      const pOld = gsRef.current.player
      const pNew = state.player
      pNew.skin = pOld.skin
      pNew.attack = pOld.attack
      pNew.defense = pOld.defense
      pNew.speed = pOld.speed
      pNew.maxHp = pOld.maxHp
      pNew.hp = pOld.maxHp // Fully heal on level up
      pNew.maxStamina = pOld.maxStamina
      pNew.stamina = pOld.maxStamina
      state.volume = gsRef.current.volume
    }
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
    sounds.playUpgrade()
    if (stat === 'hp') { p.maxHp += 15; p.hp = p.maxHp }
    if (stat === 'atk') p.attack += 3
    if (stat === 'def') p.defense += 2
    if (stat === 'spd') p.speed += 1.2
    startGame(gsRef.current.level + 1, p.score)
  }, [startGame])

  const toggleSettings = useCallback(() => {
    if (!gsRef.current) return
    gsRef.current.showingSettings = !gsRef.current.showingSettings
    setGs({ ...gsRef.current })
  }, [])

  const updateSettings = useCallback((volume?: number, skin?: string) => {
    if (!gsRef.current) return
    if (volume !== undefined) {
      gsRef.current.volume = volume
      sounds.volume = volume
    }
    if (skin !== undefined) {
      gsRef.current.player.skin = skin
    }
    setGs({ ...gsRef.current })
  }, [])

  // Continuous movement logic
  useEffect(() => {
    const DIR_MAP: Record<string, Dir> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
      W: 'up', S: 'down', A: 'left', D: 'right',
    }

    const interval = setInterval(() => {
      if (!gsRef.current || gsRef.current.gameOver || gsRef.current.upgrading || gsRef.current.showingSettings) return
      
      const activeKeys = Array.from(keysPressed.current).filter(k => DIR_MAP[k])
      if (activeKeys.length > 0) {
        const lastKey = activeKeys[activeKeys.length - 1]
        const dir = DIR_MAP[lastKey]
        if (movePlayer(gsRef.current, dir)) {
          setGs({ ...gsRef.current })
        }
      }
    }, 16)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (DIR_MAP[e.key]) {
        e.preventDefault()
        keysPressed.current.add(e.key)
      }
      if (e.code === 'Space') {
        e.preventDefault()
        if (gsRef.current) {
          handleSpaceAction(gsRef.current)
          setGs({ ...gsRef.current })
        }
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

  useEffect(() => {
    if (!gs) return
    const loop = (now: number) => {
      const dt = lastTimeRef.current ? Math.min(now - lastTimeRef.current, 50) : 16
      lastTimeRef.current = now
      if (gsRef.current && !gsRef.current.gameOver && !gsRef.current.upgrading && !gsRef.current.showingSettings) {
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
      <NavBar onSettingsToggle={toggleSettings} activeTab={gs?.showingSettings ? 'Settings' : 'Play'} />
      <StatsPanel player={gs?.player} obstacles={gs?.maxObstacles ? gs.maxObstacles - gs.obstacles.length : 0} />
      <GameView 
        gs={gs} 
        onStart={startGame} 
        onMove={() => {}} 
        onUpgrade={applyUpgrade}
        onUpdateSettings={updateSettings}
      />
    </div>
  )
}

export default App

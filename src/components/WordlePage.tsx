import React, { useEffect, useState, useRef } from 'react'
import './wordle.css'

type WordEntry = { es: string; ay: string }

const ATTEMPTS = 5
const MIN_LEN = 3
const MAX_LEN = 7

const WordlePage: React.FC<{ lang: 'es' | 'ay' }> = ({ lang = 'ay' }) => {
  const [words, setWords] = useState<WordEntry[]>([])
  const [target, setTarget] = useState('')
  const [gridSize, setGridSize] = useState(5)

  const emptyGrid = (size: number) => Array.from({ length: ATTEMPTS }, () => Array.from({ length: size }, () => ''))
  const emptyState = (size: number) => Array.from({ length: ATTEMPTS }, () => Array.from({ length: size }, () => ''))

  const [grid, setGrid] = useState<string[][]>(emptyGrid(gridSize))
  const [colors, setColors] = useState<string[][]>(emptyState(gridSize))
  const [row, setRow] = useState(0)
  const [col, setCol] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [message, setMessage] = useState('')
  const inputsRef = useRef<HTMLInputElement[][]>([] as any)

  useEffect(() => {
    fetch('/dictionary.json')
      .then((r) => r.json())
      .then((d: WordEntry[]) => {
        setWords(d)
      })
  }, [])

  useEffect(() => {
    // pick a target when words are available or language changes
    if (words.length) {
      const candidates = words.filter((w) => {
        const word = (lang === 'es' ? w.es : w.ay)
        return word.length >= MIN_LEN && word.length <= MAX_LEN
      })
      const pick = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null
      const t = pick ? (lang === 'es' ? pick.es : pick.ay) : 'PERRO'
      const up = t.toUpperCase()
      setTarget(up)
      const size = up.length
      setGridSize(size)
      // reset but keep the chosen target (don't pick another in reset)
      reset(size, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, words])

  useEffect(() => {
    // focus first empty input in current row
    if (!gameOver) {
      const ref = inputsRef.current
      if (ref && ref[row] && ref[row][col]) {
        ref[row][col].focus()
      }
    }
  }, [row, col, gameOver])

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    if (gameOver) return
    const key = e.key
    if (key === 'Backspace') {
      e.preventDefault()
      if (grid[r][c]) {
        updateCell(r, c, '')
        setCol(Math.max(0, c))
      } else if (c > 0) {
        updateCell(r, c - 1, '')
        setCol(c - 1)
      }
      return
    }
    if (key === 'Enter') {
      e.preventDefault()
      submitGuess()
      return
    }
    if (/^[a-zA-ZñÑ]$/.test(key)) {
      e.preventDefault()
      const letter = key.toUpperCase()
      updateCell(r, c, letter)
      if (c < gridSize - 1) setCol(c + 1)
    }
  }

  const updateCell = (r: number, c: number, val: string) => {
    setGrid((g) => {
      const ng = g.map((row) => row.slice())
      ng[r][c] = val
      return ng
    })
  }

  const getTranslationForTarget = () => {
    if (!words.length || !target) return null
    const tLower = target.toLowerCase()
    const entry = words.find((w) => (w.ay && w.ay.toLowerCase() === tLower) || (w.es && w.es.toLowerCase() === tLower))
    return entry ? entry.es : null
  }

  const submitGuess = () => {
    if (gameOver) return
    const guess = grid[row].join('')
    if (guess.length !== gridSize) {
      setMessage(`La palabra debe tener ${gridSize} letras`)
      return
    }
    // evaluate
    const result = evaluateGuess(guess, target)
    setColors((prev) => {
      const np = prev.map((r) => r.slice())
      np[row] = result
      return np
    })

    if (guess === target) {
      const translation = getTranslationForTarget()
      setMessage(translation ? `¡Correcto! — Español: ${translation.toUpperCase()}` : '¡Correcto!')
      setGameOver(true)
      playAymaraTTS(target)
      return
    }

    if (row + 1 >= ATTEMPTS) {
      const translation = getTranslationForTarget()
      setMessage(translation ? `Fin del juego. La palabra era: ${target} — Español: ${translation.toUpperCase()}` : `Fin del juego. La palabra era: ${target}`)
      setGameOver(true)
      playAymaraTTS(target)
      return
    }

    setRow(row + 1)
    setCol(0)
    setMessage('')
  }

  const evaluateGuess = (guess: string, targetWord: string) => {
    const colorsRow = Array.from({ length: gridSize }, () => 'absent')
    const targetArr = targetWord.split('')
    const guessArr = guess.split('')

    // first pass for correct letters
    for (let i = 0; i < gridSize; i++) {
      if (guessArr[i] === targetArr[i]) {
        colorsRow[i] = 'correct'
        targetArr[i] = '' // remove to avoid double count
        guessArr[i] = ''
      }
    }
    // second pass for present letters
    for (let i = 0; i < gridSize; i++) {
      if (guessArr[i] && targetArr.includes(guessArr[i])) {
        colorsRow[i] = 'present'
        const idx = targetArr.indexOf(guessArr[i])
        targetArr[idx] = ''
      }
    }
    return colorsRow
  }

  const reset = (size = gridSize, pickNew = true) => {
    // optionally pick a new target word
    if (pickNew && words.length) {
      const candidates = words.filter((w) => {
        const word = (lang === 'es' ? w.es : w.ay)
        return word.length >= MIN_LEN && word.length <= MAX_LEN
      })
      const pick = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null
      const t = pick ? (lang === 'es' ? pick.es : pick.ay) : 'PERRO'
      const up = t.toUpperCase()
      setTarget(up)
      size = up.length
      setGridSize(size)
    }

    setGrid(emptyGrid(size))
    setColors(emptyState(size))
    setRow(0)
    setCol(0)
    setGameOver(false)
    setMessage('')
    inputsRef.current = []
    setGridSize(size)
  }

  const playAymaraTTS = async (text: string) => {
    try {
      const res = await fetch((process.env.REACT_APP_TTS_URL || '') + '/tts/ayr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const blob = await res.blob()
      const audioUrl = URL.createObjectURL(blob)
      const audio = document.createElement('audio')
      audio.src = audioUrl
      await audio.play().catch(() => {})
    } catch (err) {
      console.error('TTS error', err)
    }
  }

  return (
    <div className="wordle-container">
      <header className="wordle-header">
        <h1>Wordle — Aymara</h1>
      </header>
      <div>
        <button onClick={() => reset()} style={{ marginLeft: 8 }}>Reiniciar</button>
      </div>

      <div className="grid" role="grid" aria-label="Wordle grid">
        {grid.map((r, ri) => (
          <div className="row" role="row" key={ri}>
            {r.map((cell, ci) => (
              <input
                key={ci}
                ref={(el) => {
                  inputsRef.current[ri] = inputsRef.current[ri] || []
                  inputsRef.current[ri][ci] = el as HTMLInputElement
                }}
                className={`tile ${colors[ri][ci]}`}
                value={cell}
                maxLength={1}
                onKeyDown={(e) => onKey(e, ri, ci)}
                onChange={() => { }}
                disabled={gameOver || ri !== row}
                aria-label={`R${ri + 1}C${ci + 1}`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="controls">
        <p className="message">{message}</p>
        <p className="hint">Intentos: {row}/{ATTEMPTS}</p>
      </div>

      <div style={{ marginTop: 12, opacity: 0.8 }}>
        <small>Teclado: escribe letras, Backspace para borrar, Enter para enviar.</small>
      </div>
    </div>
  )
}

export default WordlePage


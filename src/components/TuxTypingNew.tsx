import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const IMGS = [
  'hojas-coca.png',
  'lliclla.jpg',
  'mandarina.png',
  'papa.webp',
  'pinia.png',
  'platano.png',
  'queso.png',
  'vaso-vino.png',
];

const filenamesToWords = IMGS.map((f) => f.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').toLowerCase());

type Fish = {
  id: number;
  groupId: number;
  x: number;
  y: number;
  speed: number;
  imgIndex: number;
  label: string;
  width: number;
  height: number;
};

const loadImages = (srcs: string[]) => srcs.map((s) => { const img = new Image(); img.src = `/imgs/${s}`; return img; });
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (arr: string[]) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const TuxTypingNew: React.FC = () => {
  const navigate = useNavigate();
  const [lives, setLives] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputElRef = useRef<HTMLInputElement | null>(null);
  const requestRef = useRef<number>(0);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const fishesRef = useRef<Fish[]>([]);
  const nextIdRef = useRef<number>(1);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const inputRef = useRef<string>('');
  useEffect(() => { inputRef.current = input; }, [input]);
  const [running, setRunning] = useState(true);
  const runningRef = useRef(running);
  const tuxXRef = useRef<number>(200);
  const tuxTargetRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number | null>(null);
  const canvasWRef = useRef<number>(800);
  const canvasHRef = useRef<number>(400);
  const wordsRef = useRef<string[]>([]);
  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);
  const groupIdRef = useRef(1);
  const wordIndexRef = useRef<number>(0);
  const pendingQueueRef = useRef<number[]>([]);
  const movingToPendingRef = useRef<boolean>(false);

  // helper: get active (lowest) group id based on fishes

  // helper: get active (lowest) group id based on fishes
  const getActiveGroupId = () => {
    const groups: Record<number, number> = {};
    fishesRef.current.forEach((f) => {
      groups[f.groupId] = Math.max(groups[f.groupId] || -Infinity, f.y);
    });
    let active: number | null = null;
    let maxY = -Infinity;
    Object.keys(groups).forEach((k) => {
      const gid = Number(k);
      if (groups[gid] > maxY) { maxY = groups[gid]; active = gid; }
    });
    return active;
  };

  const getGroupLetters = (gid: number | null) => {
    if (gid === null) return '';
    return fishesRef.current.filter((f) => f.groupId === gid).slice().sort((a, b) => a.x - b.x).map((f) => f.label).join('');
  };

  const getGroupCenterX = (gid: number | null) => {
    if (gid === null) return canvasWRef.current / 2;
    const arr = fishesRef.current.filter((f) => f.groupId === gid);
    if (arr.length === 0) return canvasWRef.current / 2;
    return arr.reduce((acc, f) => acc + f.x, 0) / arr.length;
  };

  // queue a group to be eaten: freeze it and make Tux move to it when ready
  const eatGroup = (gid: number | null) => {
    if (gid === null) return;
    if (!pendingQueueRef.current.includes(gid)) pendingQueueRef.current.push(gid);
    if (!movingToPendingRef.current && pendingQueueRef.current.length > 0) {
      const next = pendingQueueRef.current[0];
      tuxTargetRef.current = getGroupCenterX(next);
      movingToPendingRef.current = true;
    }
  };

  useEffect(() => {
    imagesRef.current = loadImages(IMGS);
    fetch('/dictionary.json')
      .then((r) => r.json())
      .then((data) => {
        const arr = (data || []).map((it: any) => String(it.ay || '')).filter((w: string) => w && w.length >= 2);
        wordsRef.current = shuffle(arr.slice());
        wordIndexRef.current = 0;
      })
      .catch(() => { wordsRef.current = shuffle(filenamesToWords.slice()); wordIndexRef.current = 0; });
  }, []);

  useEffect(() => { runningRef.current = running; }, [running]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const DPR = window.devicePixelRatio || 1;

    const setSize = () => {
      const topControls = 140;
      const w = Math.max(600, window.innerWidth - 40);
      const h = Math.max(260, window.innerHeight - topControls - 40);
      canvasWRef.current = w;
      canvasHRef.current = h;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      tuxXRef.current = w / 2;
    };

    setSize();
    window.addEventListener('resize', setSize);

    // prepare words and images
    imagesRef.current = loadImages(IMGS);
    fetch('/dictionary.json')
      .then((r) => r.json())
      .then((data) => {
        const arr = (data || []).map((it: any) => String(it.ay || '')).filter((w: string) => w && w.length >= 1);
        wordsRef.current = shuffle(arr.slice());
        wordIndexRef.current = 0;
      })
      .catch(() => { wordsRef.current = shuffle(filenamesToWords.slice()); wordIndexRef.current = 0; });

    // dynamic spawn using timeout so interval can vary with difficulty
    let spawnTimeout: number | null = null;
    const computeDelay = () => {
      const s = Math.max(0, scoreRef.current || 0);
      // start at 5000ms, progress to 2000ms as score increases
      const d = Math.max(2000, 5000 - Math.floor(s / 3) * 300);
      return d;
    };

    const spawnWord = () => {
      const source = wordsRef.current.length ? wordsRef.current : filenamesToWords;
      // get next in order
      let raw = String(source[wordIndexRef.current % source.length] || 'tux');
      wordIndexRef.current += 1;
      if (wordIndexRef.current >= source.length) {
        // reshuffle and restart
        wordsRef.current = shuffle(source.slice());
        wordIndexRef.current = 0;
      }
      const norm = raw.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
      const letters = norm.toLowerCase().replace(/[^a-z\u0027]/g, '').split('');
      if (letters.length < 1) letters.push('t','u','x');
      const spacing = 48;
      const totalW = letters.length * spacing;
      const width = canvasWRef.current;
      const leftLimit = 60 + totalW / 2;
      const rightLimit = width - 60 - totalW / 2;
      const centerX = leftLimit < rightLimit ? randomInt(Math.floor(leftLimit), Math.floor(rightLimit)) : width / 2;
      const speed = 18 + Math.random() * 12;
      const gid = groupIdRef.current++;

      letters.forEach((ch, i) => {
        const fish: Fish = { id: nextIdRef.current++, groupId: gid, x: centerX - totalW / 2 + i * spacing, y: -40 - i * 6, speed, imgIndex: 0, label: ch, width: 48, height: 36 };
        fishesRef.current.push(fish);
      });
    };

    const scheduleNext = () => {
      const delay = computeDelay();
      spawnTimeout = window.setTimeout(() => {
        spawnWord();
        scheduleNext();
      }, delay);
      spawnTimerRef.current = spawnTimeout;
    };

    scheduleNext();

    const loop = () => {
      if (!runningRef.current) { requestRef.current = requestAnimationFrame(loop); return; }
      const dt = 1 / 60;
      const width = canvasWRef.current; const height = canvasHRef.current;
      // update fishes but freeze those in pending queue
      const pendingSet = new Set(pendingQueueRef.current || []);
      fishesRef.current.forEach((f) => { if (!pendingSet.has(f.groupId)) f.y += f.speed * dt; });

      // check for groups that have fallen past bottom
      const groups: Record<number, { maxY: number }> = {};
      fishesRef.current.forEach((f) => {
        if (!groups[f.groupId]) groups[f.groupId] = { maxY: f.y };
        else groups[f.groupId].maxY = Math.max(groups[f.groupId].maxY, f.y);
      });

      Object.keys(groups).forEach((k) => {
        const gid = Number(k);
        if (groups[gid].maxY > height + 20) {
          // remove entire group and decrement life
          fishesRef.current = fishesRef.current.filter((f) => f.groupId !== gid);
          setLives((l) => {
            const nl = l - 1;
            if (nl <= 0) {
              // game over
              runningRef.current = false;
              setRunning(false);
              if (spawnTimeout) clearTimeout(spawnTimeout);
            }
            return nl;
          });
        }
      });

      // draw
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#bfefff'; ctx.fillRect(0, 0, width, height);

      // determine active group (lowest on screen)
      let activeGroupId: number | null = null;
      let activeMaxY = -Infinity;
      Object.keys(groups).forEach((k) => {
        const gid = Number(k);
        if (groups[gid].maxY > activeMaxY) { activeMaxY = groups[gid].maxY; activeGroupId = gid; }
      });

      // draw fishes: color only for active group based on user input
      const activeFishes = fishesRef.current.filter((f) => f.groupId === activeGroupId).slice().sort((a, b) => a.x - b.x);
      const userNorm = normalizeForCompare(inputRef.current || '');

      // if user completed the active word, queue it for Tux to eat (freeze it)
      if (activeGroupId !== null) {
        const target = normalizeForCompare(activeFishes.map((f) => f.label).join(''));
        if (userNorm && userNorm === target) {
          // queue group
          if (!pendingQueueRef.current.includes(activeGroupId)) {
            pendingQueueRef.current.push(activeGroupId);
          }
          // if tux not already moving to a pending, start moving to this one
          if (!movingToPendingRef.current && pendingQueueRef.current.length > 0) {
            const next = pendingQueueRef.current[0];
            tuxTargetRef.current = getGroupCenterX(next);
            movingToPendingRef.current = true;
          }
          setInput('');
        }
      }

      fishesRef.current.forEach((f) => {
        const img = imagesRef.current[f.imgIndex];
        if (img && img.complete) ctx.drawImage(img, f.x - f.width / 2, f.y - f.height / 2, f.width, f.height);
        else { ctx.fillStyle = '#ffcccc'; ctx.fillRect(f.x - f.width / 2, f.y - f.height / 2, f.width, f.height); }
        // determine color
        let color = '#000';
        if (f.groupId === activeGroupId) {
          const idx = activeFishes.findIndex((af) => af.id === f.id);
          if (idx >= 0) {
            if (userNorm.length > idx) color = userNorm[idx] === f.label ? '#2ecc71' : '#e74c3c';
            else color = '#000';
          }
        } else {
          color = '#000';
        }
        ctx.fillStyle = color;
        ctx.font = '18px Fredoka One, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(f.label.toUpperCase(), f.x, f.y + 6);
      });

      // tux
      const tuxY = height - 40; const tuxX = tuxXRef.current;
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(tuxX, tuxY, 28, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(tuxX, tuxY + 4, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(tuxX + 16, tuxY); ctx.lineTo(tuxX + 24, tuxY - 6); ctx.lineTo(tuxX + 24, tuxY + 6); ctx.fill();

      if (tuxTargetRef.current !== null) {
        const dx = tuxTargetRef.current - tuxXRef.current;
        tuxXRef.current += Math.sign(dx) * Math.min(Math.abs(dx), 10);
        if (Math.abs(dx) < 4) {
          tuxTargetRef.current = null;
        }
      }

      // handle arrival to pending queue target
      if (movingToPendingRef.current && tuxTargetRef.current === null) {
        // arrived at pendingQueueRef.current[0]
        const arrived = pendingQueueRef.current.shift();
        if (typeof arrived !== 'undefined') {
          // remove group fishes
          fishesRef.current = fishesRef.current.filter((f) => f.groupId !== arrived);
          setScore((s) => s + 1);
        }
        movingToPendingRef.current = false;
        // if more pending, start moving to next
        if (pendingQueueRef.current.length > 0) {
          const next = pendingQueueRef.current[0];
          tuxTargetRef.current = getGroupCenterX(next);
          movingToPendingRef.current = true;
        }
      }

      ctx.fillStyle = '#8B4513'; ctx.font = '16px Fredoka One, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`Puntuación: ${score}`, 10, 22);
      ctx.fillText(`Vidas: ${lives}`, 180, 22);

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); if (spawnTimeout) clearTimeout(spawnTimeout); window.removeEventListener('resize', setSize); };
  }, []);

  const tryEatWord = () => {
    const user = normalizeForCompare(input.trim());
    if (!user) return;
    const active = getActiveGroupId();
    if (active === null) { setInput(''); return; }
    const letters = getGroupLetters(active);
    const target = normalizeForCompare(letters);
    if (user === target) {
      eatGroup(active);
    }
    setInput('');
  };

  function normalizeForCompare(s: string) { return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z\u0027]/g, ''); }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <button className="game-button" onClick={() => navigate('/')}>← Volver</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={{ margin: 0 }}>Tux Typing — Modo práctica</h2>
          <div style={{ color: '#8B4513' }}>Escribe la palabra en aymara que aparece abajo</div>
        </div>
        <div style={{ width: 86 }} />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        {/* hidden input, focus when user clicks canvas */}
        <input
          ref={inputElRef}
          placeholder="Escribe la palabra y pulsa Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') tryEatWord(); }}
          style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
        />
        <div style={{ color: '#8B4513', fontStyle: 'italic' }}>Haz clic en el área de juego para activar el teclado</div>
        <button className="game-button" onClick={() => { setRunning((r) => { const nr = !r; runningRef.current = nr; return nr; }); }}>{running ? 'Pausa' : 'Continuar'}</button>
        <button className="game-button" onClick={() => { fishesRef.current = []; setScore(0); setInput(''); pendingQueueRef.current = []; movingToPendingRef.current = false; }}>Reiniciar</button>
        <div style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#8B4513' }}>Puntuación: {score}</div>
      </div>

      <div style={{ border: '1px solid #ccc', position: 'relative' }} onClick={() => { inputElRef.current?.focus(); }}>
        <canvas ref={canvasRef} />
        {!running && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 'bold' }}>
            PAUSADO
          </div>
        )}
      </div>
    </div>
  );
};

export default TuxTypingNew;

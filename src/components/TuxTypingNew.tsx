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

const TuxTypingNew: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number>(0);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const fishesRef = useRef<Fish[]>([]);
  const nextIdRef = useRef<number>(1);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(true);
  const runningRef = useRef(running);
  const tuxXRef = useRef<number>(200);
  const tuxTargetRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number | null>(null);
  const canvasWRef = useRef<number>(800);
  const canvasHRef = useRef<number>(400);
  const wordsRef = useRef<string[]>([]);

  useEffect(() => {
    imagesRef.current = loadImages(IMGS);
    fetch('/dictionary.json')
      .then((r) => r.json())
      .then((data) => {
        const arr = (data || []).map((it: any) => String(it.ay || '')).filter((w: string) => w && w.length >= 2);
        wordsRef.current = arr;
      })
      .catch(() => { wordsRef.current = filenamesToWords; });
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

    const spawnWord = () => {
      if (fishesRef.current.length > 0) return;
      const source = wordsRef.current.length ? wordsRef.current : filenamesToWords;
      let raw = String(source[randomInt(0, source.length - 1)] || 'tux');
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

      letters.forEach((ch, i) => {
        const fish: Fish = { id: nextIdRef.current++, x: centerX - totalW / 2 + i * spacing, y: -40 - i * 6, speed, imgIndex: 0, label: ch, width: 48, height: 36 };
        fishesRef.current.push(fish);
      });
    };

    spawnTimerRef.current = window.setInterval(spawnWord, 3500);

    const loop = () => {
      if (!runningRef.current) { requestRef.current = requestAnimationFrame(loop); return; }
      const dt = 1 / 60;
      fishesRef.current.forEach((f) => (f.y += f.speed * dt));
      const width = canvasWRef.current; const height = canvasHRef.current;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#bfefff'; ctx.fillRect(0, 0, width, height);

      fishesRef.current.forEach((f) => {
        const img = imagesRef.current[f.imgIndex];
        if (img && img.complete) ctx.drawImage(img, f.x - f.width / 2, f.y - f.height / 2, f.width, f.height);
        else { ctx.fillStyle = '#ffcccc'; ctx.fillRect(f.x - f.width / 2, f.y - f.height / 2, f.width, f.height); }
        ctx.fillStyle = '#000'; ctx.font = '18px Fredoka One, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(f.label.toUpperCase(), f.x, f.y + 6);
      });

      const tuxY = height - 40; const tuxX = tuxXRef.current;
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(tuxX, tuxY, 28, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(tuxX, tuxY + 4, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(tuxX + 16, tuxY); ctx.lineTo(tuxX + 24, tuxY - 6); ctx.lineTo(tuxX + 24, tuxY + 6); ctx.fill();

      if (tuxTargetRef.current !== null) { const dx = tuxTargetRef.current - tuxXRef.current; tuxXRef.current += Math.sign(dx) * Math.min(Math.abs(dx), 10); if (Math.abs(dx) < 4) tuxTargetRef.current = null; }

      ctx.fillStyle = '#8B4513'; ctx.font = '16px Fredoka One, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`Puntuación: ${score}`, 10, 22);

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); if (spawnTimerRef.current) clearInterval(spawnTimerRef.current); window.removeEventListener('resize', setSize); };
  }, []);

  const tryEatWord = () => {
    const user = normalizeForCompare(input.trim());
    if (!user) return;
    if (fishesRef.current.length === 0) { setInput(''); return; }
    const letters = fishesRef.current.slice().sort((a, b) => a.x - b.x).map((f) => f.label).join('');
    const target = normalizeForCompare(letters);
    if (user === target) {
      const centerX = fishesRef.current.reduce((acc, f) => acc + f.x, 0) / fishesRef.current.length;
      tuxTargetRef.current = centerX; fishesRef.current = []; setScore((s) => s + 1);
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
        <input
          placeholder="Escribe la palabra y pulsa Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') tryEatWord(); }}
          style={{ padding: '10px 12px', fontSize: 18, flex: '0 0 420px', borderRadius: 12, border: '3px solid #D2691E', background: 'linear-gradient(45deg, #FFF8DC, #F5DEB3)', fontFamily: 'Fredoka One, sans-serif' }}
        />
        <button className="game-button" onClick={() => { setRunning((r) => { const nr = !r; runningRef.current = nr; return nr; }); }}>{running ? 'Pausa' : 'Continuar'}</button>
        <button className="game-button" onClick={() => { fishesRef.current = []; setScore(0); setInput(''); }}>Reiniciar</button>
        <div style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#8B4513' }}>Puntuación: {score}</div>
      </div>

      <div style={{ border: '1px solid #ccc' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default TuxTypingNew;

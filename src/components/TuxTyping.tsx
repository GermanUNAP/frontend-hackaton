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

const loadImages = (srcs: string[]) => {
  return srcs.map((s) => {
    const img = new Image();
    img.src = `/imgs/${s}`;
    return img;
  });
};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const sanitizeWord = (s: string) => s.replace(/[^a-z]/g, '');

const TuxTyping: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number>(0);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const fishesRef = useRef<Fish[]>([]);
  const nextIdRef = useRef<number>(1);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(true);
  const tuxXRef = useRef<number>(200);
  const tuxTargetRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number | null>(null);
  const canvasWRef = useRef<number>(800);
  const canvasHRef = useRef<number>(400);

  useEffect(() => {
    imagesRef.current = loadImages(IMGS);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const DPR = window.devicePixelRatio || 1;

    const setSize = () => {
      const ctrlHeight = 120; // space for input and buttons
      const w = Math.max(600, window.innerWidth - 40);
      const h = Math.max(300, window.innerHeight - ctrlHeight - 40);
      canvasWRef.current = w;
      canvasHRef.current = h;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    setSize();
    window.addEventListener('resize', setSize);

    const spawnWord = () => {
      // only spawn if no active fishes (player must clear current word)
      if (fishesRef.current.length > 0) return;
      // pick candidate word from filenames
      let word = sanitizeWord(filenamesToWords[randomInt(0, filenamesToWords.length - 1)]);
      if (word.length < 3) word = 'tux';
      const letters = word.split('');
      const spacing = 48;
      const totalW = letters.length * spacing;
      const width = canvasWRef.current;
      const leftLimit = 60 + totalW / 2;
      const rightLimit = width - 60 - totalW / 2;
      const centerX = leftLimit < rightLimit ? randomInt(Math.floor(leftLimit), Math.floor(rightLimit)) : width / 2;
      const speed = 30 + Math.random() * 20; // slower falling
      const imgIndex = 0; // single kind of fish

      letters.forEach((ch, i) => {
        const fish: Fish = {
          id: nextIdRef.current++,
          x: centerX - totalW / 2 + i * spacing,
          y: -40,
          speed,
          imgIndex,
          label: ch,
          width: 48,
          height: 36,
        };
        fishesRef.current.push(fish);
      });
    };

    spawnTimerRef.current = window.setInterval(spawnWord, 3000);

    const loop = () => {
      if (!running) {
        requestRef.current = requestAnimationFrame(loop);
        return;
      }

      const dt = 1 / 60;
      fishesRef.current.forEach((f) => {
        f.y += f.speed * dt;
      });

      const width = canvasWRef.current;
      const height = canvasHRef.current;

      // draw
      ctx.clearRect(0, 0, width, height);

      // sky
      ctx.fillStyle = '#bfefff';
      ctx.fillRect(0, 0, width, height);

      // fishes (letters)
      fishesRef.current.forEach((f) => {
        const img = imagesRef.current[f.imgIndex];
        if (img && img.complete) {
          ctx.drawImage(img, f.x - f.width / 2, f.y - f.height / 2, f.width, f.height);
        } else {
          ctx.fillStyle = '#ffcccc';
          ctx.fillRect(f.x - f.width / 2, f.y - f.height / 2, f.width, f.height);
        }
        // letter
        ctx.fillStyle = '#000';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(f.label.toUpperCase(), f.x, f.y + 6);
      });

      // tux (simple penguin placeholder)
      const tuxY = height - 40;
      const tuxX = tuxXRef.current;
      // body
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.ellipse(tuxX, tuxY, 28, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      // belly
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(tuxX, tuxY + 4, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      // beak
      ctx.fillStyle = '#ffb347';
      ctx.beginPath();
      ctx.moveTo(tuxX + 16, tuxY);
      ctx.lineTo(tuxX + 24, tuxY - 6);
      ctx.lineTo(tuxX + 24, tuxY + 6);
      ctx.fill();

      // move tux toward target
      if (tuxTargetRef.current !== null) {
        const dx = tuxTargetRef.current - tuxXRef.current;
        tuxXRef.current += Math.sign(dx) * Math.min(Math.abs(dx), 8);
        if (Math.abs(dx) < 4) {
          tuxTargetRef.current = null;
        }
      }

      // score and instructions
      ctx.fillStyle = '#000';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 10, 20);

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      window.removeEventListener('resize', setSize);
    };
  }, [running, score]);

  const tryEatWord = () => {
    const word = sanitizeWord(input.trim().toLowerCase());
    if (!word) return;
    if (fishesRef.current.length === 0) {
      setInput('');
      return;
    }
    const letters = fishesRef.current.slice().sort((a, b) => a.x - b.x).map((f) => f.label).join('');
    if (word === letters) {
      const centerX = fishesRef.current.reduce((acc, f) => acc + f.x, 0) / fishesRef.current.length;
      tuxTargetRef.current = centerX;
      fishesRef.current = [];
      setScore((s) => s + 1);
    }
    setInput('');
  };

  return (
    <div style={{ padding: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button className="game-button" onClick={() => navigate('/')}>← Volver</button>
        <h2 style={{ margin: 0 }}>Tux Typing — Practice Mode</h2>
        <div style={{ width: 86 }} />
      </div>

      <p style={{ marginTop: 0 }}>Words spawn as rows of fishes (one letter per fish). Type the full word shown (the lowest falling word) and press Enter before the next word appears.</p>

      <div style={{ border: '1px solid #ccc', display: 'block' }}>
        <canvas ref={canvasRef} />
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          placeholder="Type the word and press Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') tryEatWord(); }}
          style={{ padding: '10px 12px', fontSize: 18, width: 420, borderRadius: 12, border: '3px solid #D2691E', background: 'linear-gradient(45deg, #FFF8DC, #F5DEB3)', fontFamily: 'Fredoka One, sans-serif' }}
        />
        <button className="game-button" onClick={() => { setRunning((r) => !r); }}>{running ? 'Pause' : 'Resume'}</button>
        <button className="game-button" onClick={() => { fishesRef.current = []; setScore(0); setInput(''); }}>Reset</button>
        <div style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#8B4513' }}>Score: {score}</div>
      </div>
    </div>
  );
};

export default TuxTyping;

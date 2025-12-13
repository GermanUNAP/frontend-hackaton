import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as ml5 from 'ml5';
import './BodyPartsGame.css';

interface BodyPart {
  name: string;
  keypoint: string;
  spanish: string;
}

const bodyParts: BodyPart[] = [
  { name: 'nose', keypoint: 'nose', spanish: 'nariz' },
  { name: 'leftEye', keypoint: 'left_eye', spanish: 'ojo izquierdo' },
  { name: 'rightEye', keypoint: 'right_eye', spanish: 'ojo derecho' },
  { name: 'leftEar', keypoint: 'left_ear', spanish: 'oreja izquierda' },
  { name: 'rightEar', keypoint: 'right_ear', spanish: 'oreja derecha' },
  { name: 'leftShoulder', keypoint: 'left_shoulder', spanish: 'hombro izquierdo' },
  { name: 'rightShoulder', keypoint: 'right_shoulder', spanish: 'hombro derecho' },
];

const BodyPartsGame: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handposeRef = useRef<any>(null);
  const navigate = useNavigate();
  const [currentPart, setCurrentPart] = useState<BodyPart>(bodyParts[0]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState('¡Enciende la cámara y apunta a tu nariz!');

  useEffect(() => {
    handposeRef.current = ml5.handpose();
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isPlaying]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 } // Front camera
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          startDetection();
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setMessage('Error al acceder a la cámara. Verifica los permisos.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startDetection = () => {
    if (!handposeRef.current || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    handposeRef.current.on('predict', (results: any[]) => {
      if (!isPlaying) return;

      ctx.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height);

      if (results.length > 0) {
        const hand = results[0];
        const indexFingerTip = hand.landmarks[8]; // Index finger tip

        if (indexFingerTip) {
          const [x, y] = indexFingerTip;

          ctx.beginPath();
          ctx.arc(x, y, 10, 0, 2 * Math.PI);
          ctx.fillStyle = 'blue';
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();

          let targetArea = null;
          switch (currentPart.name) {
            case 'nose':
              targetArea = { x: canvas.width * 0.4, y: canvas.height * 0.3, width: canvas.width * 0.2, height: canvas.height * 0.1 };
              break;
            case 'leftEye':
              targetArea = { x: canvas.width * 0.3, y: canvas.height * 0.25, width: canvas.width * 0.1, height: canvas.height * 0.05 };
              break;
            case 'rightEye':
              targetArea = { x: canvas.width * 0.6, y: canvas.height * 0.25, width: canvas.width * 0.1, height: canvas.height * 0.05 };
              break;
            case 'leftEar':
              targetArea = { x: canvas.width * 0.2, y: canvas.height * 0.3, width: canvas.width * 0.05, height: canvas.height * 0.1 };
              break;
            case 'rightEar':
              targetArea = { x: canvas.width * 0.75, y: canvas.height * 0.3, width: canvas.width * 0.05, height: canvas.height * 0.1 };
              break;
            case 'leftShoulder':
              targetArea = { x: canvas.width * 0.25, y: canvas.height * 0.6, width: canvas.width * 0.15, height: canvas.height * 0.1 };
              break;
            case 'rightShoulder':
              targetArea = { x: canvas.width * 0.6, y: canvas.height * 0.6, width: canvas.width * 0.15, height: canvas.height * 0.1 };
              break;
          }

          if (targetArea) {
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 3;
            ctx.strokeRect(targetArea.x, targetArea.y, targetArea.width, targetArea.height);

            if (x >= targetArea.x && x <= targetArea.x + targetArea.width &&
                y >= targetArea.y && y <= targetArea.y + targetArea.height) {
              setScore(prev => prev + 1);
              const currentIndex = bodyParts.indexOf(currentPart);
              const nextIndex = (currentIndex + 1) % bodyParts.length;
              setCurrentPart(bodyParts[nextIndex]);
              setMessage(`¡Excelente! Ahora apunta a tu ${bodyParts[nextIndex].spanish}`);
            }
          }
        }
      }

      if (isPlaying) {
        requestAnimationFrame(() => handposeRef.current.predict(videoRef.current));
      }
    });

    handposeRef.current.predict(videoRef.current);
  };

  const startGame = () => {
    setIsPlaying(true);
    setMessage('¡Apunta a tu nariz con el dedo!');
  };

  const stopGame = () => {
    setIsPlaying(false);
    setMessage('Juego detenido. ¡Vuelve pronto!');
  };

  return (
    <div className="body-parts-game">
      <header className="game-header">
        <button onClick={() => navigate('/')} className="back-button">← Volver</button>
        <h1>Conoce las Partes del Cuerpo Humano</h1>
        <div className="score">Puntuación: {score}</div>
      </header>

      <div className="game-content">
        <div className="camera-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: 'auto', borderRadius: '15px' }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '15px',
            }}
          />
        </div>

        <div className="instructions">
          <p className="message">{message}</p>
          <p className="current-part">Parte actual: <strong>{currentPart.spanish}</strong></p>
          <div className="game-controls">
            {!isPlaying ? (
              <button onClick={startGame} className="start-button">
                Iniciar Juego
              </button>
            ) : (
              <button onClick={stopGame} className="stop-button">Detener</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodyPartsGame;
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
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
  const navigate = useNavigate();
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const [currentPart, setCurrentPart] = useState<BodyPart>(bodyParts[0]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState('¡Cargando modelo de detección de poses! La cámara se encenderá automáticamente.');
  const [isModelLoading, setIsModelLoading] = useState(false);

  useEffect(() => {
    const initPoseDetection = async () => {
      setIsModelLoading(true);
      try {
        await tf.ready();
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        detectorRef.current = detector;
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error initializing pose detection:', error);
        setMessage('Error al cargar el modelo de detección de poses');
        setIsModelLoading(false);
        setMessage('¡Modelo cargado! Verás cuadros alrededor de la cara y manos.');
      }
    };

    initPoseDetection();
  }, []);

  useEffect(() => {
    if (detectorRef.current) {
      startCamera();
    }
  }, [detectorRef.current]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          detectPose();
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

  const detectPose = async () => {
    if (!detectorRef.current || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const poses = await detectorRef.current.estimatePoses(videoRef.current);

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      if (poses.length > 0) {
        const pose = poses[0];

        // Draw keypoints
        drawPose(pose, ctx);

        // Draw bounding boxes for face and hands
        drawFaceBox(pose, ctx);
        drawHandBoxes(pose, ctx);
      }

      requestAnimationFrame(detectPose);
    } catch (error) {
      console.error('Error detecting pose:', error);
    }
  };

  const drawPose = (pose: poseDetection.Pose, ctx: CanvasRenderingContext2D) => {
    pose.keypoints.forEach((keypoint: poseDetection.Keypoint) => {
      if (keypoint.score !== undefined && keypoint.score > 0.5) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      }
    });
  };

  const drawFaceBox = (pose: poseDetection.Pose, ctx: CanvasRenderingContext2D) => {
    const faceKeypoints = ['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear'];
    const facePoints: poseDetection.Keypoint[] = [];

    faceKeypoints.forEach(keypointName => {
      const kp = pose.keypoints.find((k: poseDetection.Keypoint) => k.name === keypointName);
      if (kp && kp.score !== undefined && kp.score > 0.3) {
        facePoints.push(kp);
      }
    });

    if (facePoints.length >= 3) {
      let minX = Math.min(...facePoints.map(p => p.x));
      let maxX = Math.max(...facePoints.map(p => p.x));
      let minY = Math.min(...facePoints.map(p => p.y));
      let maxY = Math.max(...facePoints.map(p => p.y));

      // Add some padding
      const padding = 30;
      minX = Math.max(0, minX - padding);
      maxX = Math.min(ctx.canvas.width, maxX + padding);
      minY = Math.max(0, minY - padding);
      maxY = Math.min(ctx.canvas.height, maxY + padding);

      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 3;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

      ctx.fillStyle = 'blue';
      ctx.font = '16px Arial';
      ctx.fillText('Cara', minX + 5, minY - 5);
    }
  };

  const drawHandBoxes = (pose: poseDetection.Pose, ctx: CanvasRenderingContext2D) => {
    const handKeypoints = [
      ['left_wrist', 'left_thumb', 'left_index', 'left_pinky'],
      ['right_wrist', 'right_thumb', 'right_index', 'right_pinky']
    ];

    handKeypoints.forEach((handGroup, handIndex) => {
      const handPoints: poseDetection.Keypoint[] = [];

      handGroup.forEach(keypointName => {
        const kp = pose.keypoints.find((k: poseDetection.Keypoint) => k.name === keypointName);
        if (kp && kp.score !== undefined && kp.score > 0.3) {
          handPoints.push(kp);
        }
      });

      if (handPoints.length >= 2) {
        let minX = Math.min(...handPoints.map(p => p.x));
        let maxX = Math.max(...handPoints.map(p => p.x));
        let minY = Math.min(...handPoints.map(p => p.y));
        let maxY = Math.max(...handPoints.map(p => p.y));

        // Add padding for hand box
        const padding = 40;
        minX = Math.max(0, minX - padding);
        maxX = Math.min(ctx.canvas.width, maxX + padding);
        minY = Math.max(0, minY - padding);
        minY = Math.min(ctx.canvas.height, maxY + padding);

        ctx.strokeStyle = handIndex === 0 ? 'green' : 'orange';
        ctx.lineWidth = 3;
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

        ctx.fillStyle = handIndex === 0 ? 'green' : 'orange';
        ctx.font = '16px Arial';
        ctx.fillText(handIndex === 0 ? 'Mano Izquierda' : 'Mano Derecha', minX + 5, minY - 5);
      }
    });
  };

  const checkPointing = (hand: poseDetection.Keypoint, ctx: CanvasRenderingContext2D) => {
    let targetArea = null;
    switch (currentPart.name) {
      case 'nose':
        targetArea = { x: ctx.canvas.width * 0.4, y: ctx.canvas.height * 0.3, width: ctx.canvas.width * 0.2, height: ctx.canvas.height * 0.1 };
        break;
      case 'leftEye':
        targetArea = { x: ctx.canvas.width * 0.3, y: ctx.canvas.height * 0.25, width: ctx.canvas.width * 0.1, height: ctx.canvas.height * 0.05 };
        break;
      case 'rightEye':
        targetArea = { x: ctx.canvas.width * 0.6, y: ctx.canvas.height * 0.25, width: ctx.canvas.width * 0.1, height: ctx.canvas.height * 0.05 };
        break;
      case 'leftEar':
        targetArea = { x: ctx.canvas.width * 0.2, y: ctx.canvas.height * 0.3, width: ctx.canvas.width * 0.05, height: ctx.canvas.height * 0.1 };
        break;
      case 'rightEar':
        targetArea = { x: ctx.canvas.width * 0.75, y: ctx.canvas.height * 0.3, width: ctx.canvas.width * 0.05, height: ctx.canvas.height * 0.1 };
        break;
      case 'leftShoulder':
        targetArea = { x: ctx.canvas.width * 0.25, y: ctx.canvas.height * 0.6, width: ctx.canvas.width * 0.15, height: ctx.canvas.height * 0.1 };
        break;
      case 'rightShoulder':
        targetArea = { x: ctx.canvas.width * 0.6, y: ctx.canvas.height * 0.6, width: ctx.canvas.width * 0.15, height: ctx.canvas.height * 0.1 };
        break;
    }

    if (targetArea) {
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = 3;
      ctx.strokeRect(targetArea.x, targetArea.y, targetArea.width, targetArea.height);

      ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
      ctx.fillRect(targetArea.x, targetArea.y, targetArea.width, targetArea.height);

      if (hand.x >= targetArea.x && hand.x <= targetArea.x + targetArea.width &&
          hand.y >= targetArea.y && hand.y <= targetArea.y + targetArea.height) {
        setScore(prev => prev + 1);
        const currentIndex = bodyParts.indexOf(currentPart);
        const nextIndex = (currentIndex + 1) % bodyParts.length;
        setCurrentPart(bodyParts[nextIndex]);
        setMessage(`¡Excelente! Ahora apunta a tu ${bodyParts[nextIndex].spanish}`);
      }
    }
  };

  const startGame = () => {
    if (!detectorRef.current) {
      setMessage('Cargando modelo de detección de poses...');
      return;
    }
    setIsPlaying(true);
    setMessage('¡Juego iniciado! Apunta a las partes del cuerpo con la mano.');
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
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '15px',
              display: 'block'
            }}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '15px',
              display: 'block'
            }}
          />
          {false && (
            <div
              style={{
                width: '100%',
                height: '400px',
                background: 'linear-gradient(135deg, #8B4513, #D2691E)',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                fontSize: '48px',
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                zIndex: 1
              }}>
                📹
              </div>
            </div>
          )}
        </div>

        <div className="instructions">
          <p className="message">{message}</p>
          <p className="current-part">Parte actual: <strong>{currentPart.spanish}</strong></p>
          <div className="game-controls">
            {!isPlaying ? (
              <button onClick={startGame} className="start-button" disabled={isModelLoading}>
                {isModelLoading ? 'Cargando modelo...' : 'Iniciar Juego'}
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

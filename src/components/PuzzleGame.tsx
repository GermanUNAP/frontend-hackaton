import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './PuzzleGame.css';

interface Piece {
  id: number;
  x: number;
  y: number;
  correctX: number;
  correctY: number;
  isPlaced: boolean;
}

const PuzzleGame: React.FC = () => {
  const navigate = useNavigate();
  const [imageSrc] = useState('/imgs/mandarina.png');
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [pieceSize, setPieceSize] = useState(100);
  const [areaSize, setAreaSize] = useState(500);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const updateSizes = () => {
      const width = window.innerWidth;
      const newIsMobile = width <= 768;
      setIsMobile(newIsMobile);
      let newAreaSize = 500;
      if (width <= 480) newAreaSize = 350;
      else if (width <= 768) newAreaSize = 400;
      else newAreaSize = 500;
      setAreaSize(newAreaSize);
      const innerSize = newAreaSize - 20;
      const maxDim = Math.max(rows, cols);
      const newPieceSize = Math.floor(innerSize / maxDim);
      setPieceSize(Math.min(newPieceSize, newIsMobile ? 80 : 100));
    };
    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, [rows, cols]);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImageWidth(img.naturalWidth);
      setImageHeight(img.naturalHeight);
      setImageLoaded(true);
      generatePieces();
    };
  }, [rows, cols, imageSrc, pieceSize]);

  const generatePieces = () => {
    const maxPieceSize = isMobile ? 80 : 100;
    const safeArea = areaSize - maxPieceSize;
    const newPieces: Piece[] = [];
    for (let i = 0; i < rows * cols; i++) {
      const x = i % cols;
      const y = Math.floor(i / cols);
      newPieces.push({
        id: i,
        x: Math.random() * safeArea,
        y: Math.random() * safeArea,
        correctX: x,
        correctY: y,
        isPlaced: false,
      });
    }
    setPieces(newPieces);
    setIsComplete(false);
    setScore(0);
    setStartTime(Date.now());
    setEndTime(null);
  };

  const handleDragStart = (e: React.DragEvent, piece: Piece) => {
    e.dataTransfer.setData('text/plain', piece.id.toString());
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const pieceId = parseInt(e.dataTransfer.getData('text/plain'));
    const rect = e.currentTarget.getBoundingClientRect();
    let x = e.clientX - rect.left - pieceWidth / 2;
    let y = e.clientY - rect.top - pieceHeight / 2;

    const piece = pieces.find(p => p.id === pieceId);
    if (piece) {
      const correctX = piece.correctX * pieceWidth;
      const correctY = piece.correctY * pieceHeight;
      const distance = Math.sqrt((x - correctX) ** 2 + (y - correctY) ** 2);
      if (distance < Math.min(pieceWidth, pieceHeight) / 2.5) {
        x = correctX;
        y = correctY;
      }
    }

    setPieces(prev => prev.map(p => {
      if (p.id === pieceId) {
        const isPlaced = Math.abs(x - p.correctX * pieceWidth) < Math.min(pieceWidth, pieceHeight) / 6.67 && Math.abs(y - p.correctY * pieceHeight) < Math.min(pieceWidth, pieceHeight) / 6.67;
        return { ...p, x, y, isPlaced };
      }
      return p;
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (pieces.length > 0 && pieces.every(piece => piece.isPlaced) && !isComplete) {
      setIsComplete(true);
      setEndTime(Date.now());
      const timeTaken = startTime ? (Date.now() - startTime) / 1000 : 0;
      const baseScore = rows * cols * 10;
      const timeBonus = Math.max(0, 300 - timeTaken);
      setScore(baseScore + Math.floor(timeBonus));
    }
  }, [pieces, isComplete, startTime, rows, cols]);

  const innerSize = areaSize - 20;
  const aspect = imageWidth && imageHeight ? imageWidth / imageHeight : 1;
  const gridWidth = aspect > 1 ? innerSize : innerSize * aspect;
  const gridHeight = aspect > 1 ? innerSize / aspect : innerSize;
  const pieceWidth = gridWidth / cols;
  const pieceHeight = gridHeight / rows;

  const resetGame = () => {
    generatePieces();
  };

  return (
    <div className="puzzle-game">
      <header className="game-header">
        <button onClick={() => navigate('/')} className="back-button">← Volver</button>
        <h1>Rompecabezas</h1>
        <div className="score">Puntuación: {score}</div>
      </header>

      <div className="controls">
        <div className="control-group">
          <label>Filas:</label>
          <button className="control-btn" onClick={() => setRows(Math.max(2, rows - 1))}>-</button>
          <span className="control-value">{rows}</span>
          <button className="control-btn" onClick={() => setRows(Math.min(10, rows + 1))}>+</button>
        </div>
        <div className="control-group">
          <label>Columnas:</label>
          <button className="control-btn" onClick={() => setCols(Math.max(2, cols - 1))}>-</button>
          <span className="control-value">{cols}</span>
          <button className="control-btn" onClick={() => setCols(Math.min(10, cols + 1))}>+</button>
        </div>
        <button className="reset-btn" onClick={resetGame}>Reiniciar</button>
      </div>

      <div className="game-content">
        <div className="puzzle-area">
          <div
            className="grid-area"
            style={{
              width: `${gridWidth}px`,
              height: `${gridHeight}px`,
              '--rows': rows,
              '--cols': cols
            } as any}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {imageLoaded && pieces.map(piece => (
              <div
                key={piece.id}
                className={`puzzle-piece ${piece.isPlaced ? 'placed' : ''}`}
                onPointerDown={(e) => {
                  if (!piece.isPlaced) {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setDraggedPiece(piece.id);
                  }
                }}
                onPointerMove={(e) => {
                  if (draggedPiece === piece.id) {
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    if (rect) {
                      const x = e.clientX - rect.left - pieceWidth / 2;
                      const y = e.clientY - rect.top - pieceHeight / 2;
                      setPieces(prev => prev.map(p => p.id === piece.id ? { ...p, x, y } : p));
                    }
                  }
                }}
                onPointerUp={(e) => {
                  if (draggedPiece === piece.id) {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    if (rect) {
                      let x = e.clientX - rect.left - pieceWidth / 2;
                      let y = e.clientY - rect.top - pieceHeight / 2;
                      const correctX = piece.correctX * pieceWidth;
                      const correctY = piece.correctY * pieceHeight;
                      const distance = Math.sqrt((x - correctX) ** 2 + (y - correctY) ** 2);
                      if (distance < Math.min(pieceWidth, pieceHeight) / 2.5) {
                        x = correctX;
                        y = correctY;
                      }
                      setPieces(prev => prev.map(p => {
                        if (p.id === piece.id) {
                          const isPlaced = Math.abs(x - p.correctX * pieceWidth) < Math.min(pieceWidth, pieceHeight) / 6.67 && Math.abs(y - p.correctY * pieceHeight) < Math.min(pieceWidth, pieceHeight) / 6.67;
                          return { ...p, x, y, isPlaced };
                        }
                        return p;
                      }));
                    }
                    setDraggedPiece(null);
                  }
                }}
                style={{
                  backgroundImage: `url(${imageSrc})`,
                  backgroundSize: `${gridWidth}px ${gridHeight}px`,
                  backgroundPosition: `-${piece.correctX * gridWidth / cols}px -${piece.correctY * gridHeight / rows}px`,
                  left: piece.x,
                  top: piece.y,
                  width: `${pieceWidth}px`,
                  height: `${pieceHeight}px`,
                }}
              />
            ))}
          </div>
        </div>

        {isComplete && (
          <div className="completion-message">
            ¡Felicidades! Has completado el rompecabezas.<br />
            Puntuación final: {score} puntos<br />
            Tiempo: {endTime && startTime ? Math.floor((endTime - startTime) / 1000) : 0} segundos
          </div>
        )}
      </div>
    </div>
  );
};

export default PuzzleGame;
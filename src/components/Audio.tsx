import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import './Audio.css';

const Audio: React.FC = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    setError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('SpeechRecognition no es soportado en este navegador.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ayr';
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }
        setTranscript((prev) => (final ? prev + ' ' + final : prev));
        if (final) {
          const SERVER_URL = process.env.REACT_APP_BACKEND_URL + '/chat' || '';
          if (SERVER_URL) {
            fetch(SERVER_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: final }),
            }).catch((err) => console.error('Error sending transcript', err));
          }
        }
      };
      recognition.onerror = (e: any) => setError(e.error || 'Error en reconocimiento');
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch (err: any) {
      setError(err.message || 'Error iniciando reconocimiento');
    }
  };

  const stopListening = () => {
    const r = recognitionRef.current;
    if (r) {
      try { r.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    setListening(false);
  };

  useEffect(() => {
    return () => {
      const r = recognitionRef.current;
      if (r) {
        try { r.onresult = null; r.onend = null; r.onerror = null; r.stop(); } catch (_) {}
      }
    };
  }, []);

  const playWav = async () => {
    const res = await fetch(process.env.REACT_APP_TTS_URL + '/tts/ayr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Aymara arusa amtasipxañani' }),
    })
    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    console.log('Audio URL:', audioUrl);
    const audio = document.createElement('audio');
    audio.src = audioUrl;
    audio.play();
  };

  return (
    <div className="home-container">
      <main className="home-main">
        <div className="game-dashboard">
          <h2 className="dashboard-title">Audio (Reconocimiento de voz)</h2>

          <div className="audio-controls">
            <Link to="/" className="game-button">🏠 Volver</Link>
            <button className="game-button" onClick={() => (listening ? stopListening() : startListening())}>
              {listening ? 'Detener' : 'Iniciar'}
            </button>
            <p style={{margin:0}}>{listening ? '🎤 Escuchando...' : '⏸️ Inactivo'}</p>
          </div>

          <div className="transcript-box">
            <strong>Transcripción:</strong>
            <div>{transcript || <em>Sin transcripción aún.</em>}</div>
          </div>
          <button className="game-button" onClick={playWav}>
            ▶️ Reproducir Audio de Prueba
          </button>
          <audio src={audioData ? URL.createObjectURL(audioData) : undefined} controls style={{marginTop: '10px'}} />

          {error && <p className="error">{error}</p>}
        </div>
      </main>
    </div>
  );
};

export default Audio;

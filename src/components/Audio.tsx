import React, { useState, useEffect, useRef } from 'react';
import './Home.css';

const Audio: React.FC = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
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
      recognition.lang = 'es-ES';
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
        setTranscript((prev) => (final ? prev + ' ' + final : prev + interim));
        if (final) {
          const SERVER_URL = process.env.REACT_APP_SERVER_URL || process.env.REACT_APP_API_URL || '';
          if (SERVER_URL) {
            fetch(SERVER_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: final, lang: 'es' }),
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

  return (
    <div className="audio-page">
      <h2>Audio (Reconocimiento de voz)</h2>
      <p>{listening ? '🎤 Escuchando...' : '⏸️ Inactivo'}</p>
      <button className="game-button" onClick={() => (listening ? stopListening() : startListening())}>
        {listening ? 'Detener' : 'Iniciar'}
      </button>
      <p><strong>Transcripción:</strong> {transcript}</p>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Audio;

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSignOutAlt, FaBook, FaPray, FaKeyboard, FaPuzzlePiece, FaBrain, FaMicrophone, FaTrophy, FaUsers, FaQuestionCircle, FaChalkboardTeacher, FaEdit, FaUserGraduate, FaChartBar, FaBookOpen } from 'react-icons/fa';
import './Home.css';

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

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

  const handleButtonClick = (action: string) => {
    if (action === 'Conoce las partes del cuerpo humano') {
      navigate('/body-parts-game');
    } else {
      alert(`Función ${action} próximamente disponible!`);
    }
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="home-title">¡Bienvenido, {user?.name}!</h1>
        <div className="user-menu-container">
          <button
            className="user-menu-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <FaUser />
          </button>
          {showUserMenu && (
            <div className="user-menu">
              <div className="user-info">
                <p><strong>Nombre:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Rol:</strong> {user?.role === 'student' ? 'Estudiante' : 'Profesor'}</p>
              </div>
              <button onClick={logout} className="logout-button">Cerrar Sesión <FaSignOutAlt /></button>
            </div>
          )}
        </div>
      </header>

      <main className="home-main">
        <div className="game-dashboard">
          <h2 className="dashboard-title">Elige tu Aventura Educativa</h2>

          {user?.role === 'student' && (
            <div className="button-grid">
              <Link to="/wordle" className="game-button"><FaBook /> Adivina la palabra</Link>
              <Link to="/ritual" className="game-button"><FaPray /> Ritual de agradecimiento</Link>
              <Link to="/tux" className="game-button"><FaKeyboard /> Escribe con Tux</Link>
              <Link to="/puzzle" className="game-button"><FaPuzzlePiece /> Rompecabezas</Link>
              <Link className="game-button" to="/body-parts-game"><FaBrain /> Conoce las partes del cuerpo humano</Link>
              <Link to="/audio" className="game-button"><FaMicrophone /> Reconocimiento de voz</Link>
              <button className="game-button" onClick={() => handleButtonClick('Logros')}>
                <FaTrophy /> Logros y Medallas
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Amigos')}>
                <FaUsers /> Amigos y Compañeros
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Ayuda')}>
                <FaQuestionCircle /> Centro de Ayuda
              </button>
            </div>
          )}

          {user?.role === 'teacher' && (
            <div className="button-grid">
              <button className="game-button" onClick={() => handleButtonClick('Clases')}>
                <FaChalkboardTeacher /> Gestión de Clases
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Contenido')}>
                <FaEdit /> Creación de Contenido
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Estudiantes')}>
                <FaUserGraduate /> Seguimiento de Estudiantes
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Reportes')}>
                <FaChartBar /> Reportes y Estadísticas
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Recursos')}>
                <FaBookOpen /> Biblioteca de Recursos
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Ayuda')}>
                <FaQuestionCircle /> Centro de Ayuda
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;

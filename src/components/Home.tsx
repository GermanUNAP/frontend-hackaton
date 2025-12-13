import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleButtonClick = (action: string) => {
    alert(`Función ${action} próximamente disponible!`);
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
            👤
          </button>
          {showUserMenu && (
            <div className="user-menu">
              <div className="user-info">
                <p><strong>Nombre:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Rol:</strong> {user?.role === 'student' ? 'Estudiante' : 'Profesor'}</p>
              </div>
              <button onClick={logout} className="logout-button">Cerrar Sesión 🚪</button>
            </div>
          )}
        </div>
      </header>

      <main className="home-main">
        <div className="game-dashboard">
          <h2 className="dashboard-title">Elige tu Aventura Educativa</h2>

          {user?.role === 'student' && (
            <div className="button-grid">
              <button className="game-button" onClick={() => handleButtonClick('Lecciones')}>
                📚 Lecciones Interactivas
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Juegos')}>
                🎮 Juegos Educativos
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Progreso')}>
                📊 Mi Progreso
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Logros')}>
                🏆 Logros y Medallas
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Amigos')}>
                👫 Amigos y Compañeros
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Ayuda')}>
                ❓ Centro de Ayuda
              </button>
            </div>
          )}

          {user?.role === 'teacher' && (
            <div className="button-grid">
              <button className="game-button" onClick={() => handleButtonClick('Clases')}>
                📝 Gestión de Clases
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Contenido')}>
                ✏️ Creación de Contenido
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Estudiantes')}>
                👨‍🎓 Seguimiento de Estudiantes
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Reportes')}>
                📈 Reportes y Estadísticas
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Recursos')}>
                📚 Biblioteca de Recursos
              </button>
              <button className="game-button" onClick={() => handleButtonClick('Ayuda')}>
                ❓ Centro de Ayuda
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
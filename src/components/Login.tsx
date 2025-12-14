import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';
import { ToastState, LoginData } from '../types';
import './Auth.css';
import './Toast.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', show: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate fake login for student
    setTimeout(() => {
      const fakeUser = {
        id: '1',
        name: 'Estudiante Ejemplo',
        email: email,
        role: 'student' as const,
      };
      const fakeToken = 'fake-token';
      login(fakeUser, fakeToken);
      setToast({ message: 'Inicio de sesión exitoso', type: 'success', show: true });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src="/wawa_aru.png" alt="Logo" className="auth-logo" />
        <h2 className="auth-title">¡Bienvenido de vuelta, Aprendiz!</h2>
        <p className="auth-subtitle">Continúa tu viaje educativo</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Ingresa tu correo electrónico"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Ingresa tu contraseña"
            />
          </div>
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
        <p className="auth-link">
          ¿No tienes una cuenta? <span onClick={() => navigate('/register')} style={{cursor: 'pointer', color: 'var(--color3)'}}>Regístrate aquí</span>
        </p>
      </div>
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
};

export default Login;
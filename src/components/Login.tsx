import React, { useState } from 'react';
import { login as loginService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';
import { ToastState, LoginData } from '../types';
import './Auth.css';
import './Toast.css';

interface LoginProps {
  setPage: (page: 'login' | 'register') => void;
}

const Login: React.FC<LoginProps> = ({ setPage }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', show: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data: LoginData = { email, password };
      const response = await loginService(data);
      if (response.token && response.user) {
        login(response.user, response.token);
        setToast({ message: 'Inicio de sesión exitoso', type: 'success', show: true });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
      } else {
        setToast({ message: 'Error en el inicio de sesión. Verifica tus credenciales.', type: 'error', show: true });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
      }
    } catch (err) {
      setToast({ message: 'Error en el inicio de sesión. Verifica tus credenciales.', type: 'error', show: true });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
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
          ¿No tienes una cuenta? <span onClick={() => setPage('register')} style={{cursor: 'pointer', color: 'var(--color3)'}}>Regístrate aquí</span>
        </p>
      </div>
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
};

export default Login;
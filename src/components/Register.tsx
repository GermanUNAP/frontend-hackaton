import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register as registerService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';
import { ToastState, RegisterData } from '../types';
import './Auth.css';
import './Toast.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', show: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data: RegisterData = { name, email, password };
      const response = await registerService(data);
      if (response.token && response.user) {
        login(response.user, response.token);
        setToast({ message: 'Registro exitoso', type: 'success', show: true });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
      } else {
        setToast({ message: 'Error en el registro. Inténtalo de nuevo.', type: 'error', show: true });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
      }
    } catch (err) {
      setToast({ message: 'Error en el registro. Inténtalo de nuevo.', type: 'error', show: true });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src="/wawa_aru.png" alt="Logo" className="auth-logo" />
        <h5 className="auth-title">¡Únete a la Comunidad Educativa!</h5>
        <p className="auth-subtitle">Comienza tu aventura de aprendizaje</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="name">Nombre Completo</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ingresa tu nombre completo"
            />
          </div>
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
            {isLoading ? 'Cargando...' : 'Registrarse'}
          </button>
        </form>
        <p className="auth-link">
          ¿Ya tienes una cuenta? <span onClick={() => navigate('/login')} style={{cursor: 'pointer', color: 'var(--color3)'}}>Inicia sesión aquí</span>
        </p>
      </div>
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
};

export default Register;
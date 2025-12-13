import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import WordlePage from './components/WordlePage';
import Ritual from './components/Ritual';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute';
import BodyPartsGame from './components/BodyPartsGame';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [page, setPage] = useState<'login' | 'register'>('login');

  if (isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/body-parts-game" element={<BodyPartsGame />} />
        <Route path="/wordle" element={<WordlePage lang="ay" />} />
        <Route path="/ritual" element={<Ritual />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <div className="App">
              <Login />
            </div>
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <div className="App">
              <Register />
            </div>
          )
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;

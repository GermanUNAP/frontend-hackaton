import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState<'login' | 'register'>('login');

  if (isAuthenticated) {
    return <div>Dashboard Placeholder</div>; // Replace with actual dashboard
  }

  return (
    <div className="App">
      {page === 'login' ? <Login setPage={setPage} /> : <Register setPage={setPage} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
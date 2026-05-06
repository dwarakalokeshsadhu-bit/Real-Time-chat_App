import React from 'react';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Workspace from './pages/Workspace';
import { useAuthStore } from './store/authSlice';

export default function App() {
  const user = useAuthStore(s => s.user);
  const applyAuthCallback = useAuthStore(s => s.applyAuthCallback);
  const [mode, setMode] = useState('home');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const encodedUser = params.get('user');

    if (!accessToken || !encodedUser) return;

    try {
      applyAuthCallback(accessToken, JSON.parse(encodedUser));
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('OAuth callback failed', err);
    }
  }, [applyAuthCallback]);

  if (user) return <Workspace />;
  if (mode === 'home') {
    return (
      <Home
        goToLogin={() => setMode('login')}
        goToRegister={() => setMode('register')}
      />
    );
  }

  return mode === 'login'
    ? <Login switchMode={() => setMode('register')} />
    : <Register switchMode={() => setMode('login')} />;
}

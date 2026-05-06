import React from 'react';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Workspace from './pages/Workspace';
import { useAuthStore } from './store/authSlice';

const teamMembers = [
  'Sashreek',
  'Lokesh',
  'Tejas',
  'Jashvitha',
  'Shaik Sadiq',
];

function githubSearchUrl(name) {
  return `https://github.com/search?q=${encodeURIComponent(name)}&type=users`;
}

export default function App() {
  const user = useAuthStore(s => s.user);
  const applyAuthCallback = useAuthStore(s => s.applyAuthCallback);
  const [mode, setMode] = useState(() => (user ? 'workspace' : 'home'));

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

  useEffect(() => {
    if (user && (mode === 'login' || mode === 'register')) {
      setMode('workspace');
    }
  }, [mode, user]);

  const showFooter = mode !== 'workspace';

  return (
    <div className="public-page">
      <nav className="app-navbar" aria-label="Primary navigation">
        <button
          type="button"
          className={mode === 'home' ? 'active' : ''}
          onClick={() => setMode('home')}
        >
          Home
        </button>
        <button
          type="button"
          className={mode === 'login' ? 'active' : ''}
          onClick={() => setMode('login')}
        >
          Login
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'active' : ''}
          onClick={() => setMode('register')}
        >
          Required Fields
        </button>
        {user && (
          <button
            type="button"
            className={mode === 'workspace' ? 'active' : ''}
            onClick={() => setMode('workspace')}
          >
            Chat
          </button>
        )}
      </nav>

      {mode === 'workspace' && user ? (
        <Workspace />
      ) : mode === 'home' ? (
        <Home
          goToLogin={() => setMode('login')}
          goToRegister={() => setMode('register')}
        />
      ) : mode === 'login' ? (
        <Login switchMode={() => setMode('register')} />
      ) : (
        <Register switchMode={() => setMode('login')} />
      )}

      {showFooter && (
        <footer className="team-footer">
          <div>
            <p className="footer-kicker">Git profiles</p>
            <h2>Team members</h2>
          </div>
          <div className="team-links">
            {teamMembers.map(member => (
              <a key={member} href={githubSearchUrl(member)} target="_blank" rel="noreferrer">
                {member}
              </a>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}

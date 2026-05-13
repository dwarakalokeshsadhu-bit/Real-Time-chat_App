import React from 'react';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Workspace from './pages/Workspace';
import { useAuthStore } from './store/authSlice';

const teamMembers = [
  {
    name: 'Tejas',
    profile: 'https://www.linkedin.com/in/tejas-damera-18152a3a2',
  },
  {
    name: 'Lokesh',
    profile: 'https://www.linkedin.com/in/dwaraka-lokesh-sadhu-286627323/',
  },
  {
    name: 'Sadiq',
    profile: 'https://www.linkedin.com/in/shaik-sadiq-b1650a377/',
  },
  {
    name: 'Jashvitha',
    profile: 'https://www.linkedin.com/in/jashvitha-k-13a8ba408/',
  },
  {
    name: 'Sashreek',
    profile: 'https://www.linkedin.com/in/sashreekg/',
  },
];


function AboutView() {
  return (
    <main className="about-page">
      <section className="about-shell">
        <div className="about-copy">
          <p className="home-kicker">About the application</p>
          <h1>Realtime Chat brings team conversations, files, calls, and presence into one workspace.</h1>
          <p>
            This app is built for small teams who need fast communication without jumping between separate tools.
            It combines channels, direct messages, uploads, reactions, and call controls in a focused chat interface.
          </p>
        </div>

        <div className="feature-grid" aria-label="Application features">
          {appFeatures.map(feature => (
            <article className="feature-card" key={feature}>
              <span></span>
              <p>{feature}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
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
    if (!user && mode === 'workspace') {
      setMode('home');
    }
  }, [mode, user]);

  const showPublicChrome = !user && mode !== 'workspace';
  const showFooter = showPublicChrome;

  return (
    <div className={mode === 'workspace' && user ? 'public-page workspace-mode' : 'public-page'}>
      {showPublicChrome && (
        <nav className="app-navbar" aria-label="Primary navigation">
          <button type="button" className="nav-brand" onClick={() => setMode('home')}>
            ChatRoom
          </button>
          <div className="nav-links">
            <button
              type="button"
              className={mode === 'home' ? 'active' : ''}
              onClick={() => setMode('home')}
            >
              Home
            </button>
            <button
              type="button"
              className={mode === 'about' ? 'active' : ''}
              onClick={() => setMode('about')}
            >
              About
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => setMode('register')}
            >
              Register
            </button>
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              Login
            </button>
          </div>
        </nav>
      )}

      {mode === 'workspace' && user ? (
        <Workspace goHome={() => setMode('home')} />
      ) : mode === 'home' ? (
        <Home
          goToLogin={() => setMode('login')}
          goToRegister={() => setMode('register')}
        />
      ) : mode === 'about' ? (
        <AboutView />
      ) : mode === 'login' ? (
        <Login switchMode={() => setMode('register')} />
      ) : (
        <Register switchMode={() => setMode('login')} />
      )}

      {showFooter && (
        <footer className="team-footer">
          <div className="footer-main">
            <section className="footer-brand">
              <div className="footer-brand-row">
                <span className="footer-mark" aria-hidden="true">C</span>
                <h2>ChatRoom</h2>
              </div>
              <p>
                A realtime chat application for fast team conversations, direct messages, file sharing,
                calls, and presence in one focused workspace.
              </p>
            </section>

           

            <section className="footer-column">
              <h3>LinkedIn Profiles</h3>
              <ul>
                {teamMembers.map(member => (
                  <li key={member.name}>
                    <a href={member.profile} target="_blank" rel="noreferrer">
                      {member.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="footer-column">
              <h3>Contact & Legal</h3>
              <ul>
                <li>Realtime Chat Workspace</li>
                <li>support@chatroom.app</li>
                <li><a href="#terms">Terms of Use</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#cookies">Cookie Policy</a></li>
              </ul>
            </section>
          </div>

          <div className="footer-bottom">
            <p>© 2026 <strong>ChatRoom</strong>. All rights reserved.</p>
            <div className="footer-status" aria-label="Application status">
              <span>System Operational</span>
              <span>Realtime messaging</span>
              <span>Secure sessions</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

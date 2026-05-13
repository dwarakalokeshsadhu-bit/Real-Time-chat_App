import React from "react";
import heroImage from "../../assets/chat-home.svg";

export default function Home({ goToLogin, goToRegister }) {
  return (
    <main className="home-page">
      <section className="home-shell">
        <div className="home-copy">
          <p className="home-kicker">Realtime chat workspace</p>
          <h1>Welcome to ChatRoom</h1>
          <p className="home-subtitle">
            A clean messaging space where teams can talk in channels, share files, make calls, and keep direct conversations easy to follow.
          </p>
          <div className="home-actions">
            <button type="button" className="home-primary" onClick={goToLogin}>
              Sign In
            </button>
            <button type="button" className="home-secondary" onClick={goToRegister}>
              Create Account
            </button>
          </div>
        </div>

        <div className="home-visual" aria-label="Realtime chat preview">
          <img src={heroImage} alt="Chat interface preview" />
        </div>
      </section>
    </main>
  );
}

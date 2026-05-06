import React from "react";
import heroImage from "../../assets/chat-home.svg";

export default function Home({ goToLogin, goToRegister }) {
  return (
    <main className="home-page">
      <section className="home-shell">
        <div className="home-copy">
          <p className="home-kicker">Realtime chat workspace</p>
          <h1>Bring every conversation into one warm, focused room.</h1>
          <p className="home-subtitle">
            Message teams, share files, start calls, and keep direct chats moving with a clean collaborative workspace.
          </p>
          <div className="home-actions">
            <button type="button" className="home-primary" onClick={goToLogin}>
              Get started
            </button>
            <button type="button" className="home-secondary" onClick={goToRegister}>
              Create account
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

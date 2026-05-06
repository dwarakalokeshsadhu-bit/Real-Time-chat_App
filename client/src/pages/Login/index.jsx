import React from "react";
import { useState } from 'react';
import { useAuthStore } from '../../store/authSlice';

export default function Login({ switchMode }) {
  const login = useAuthStore(s => s.login);
  const loginWithProvider = useAuthStore(s => s.loginWithProvider);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    try { await login(email, password); } catch (err) { setError(err.response?.data?.message || 'Login failed'); }
  }
  return <div className="auth"><form onSubmit={submit}>
    <h1>Login</h1>{error && <p className="error">{error}</p>}
    <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
    <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
    <button>Login</button>
    <div className="social-auth">
      <button type="button" onClick={() => loginWithProvider('google')}>Continue with Google</button>
    </div>
    <p onClick={switchMode}>Create account</p>
  </form></div>;
}

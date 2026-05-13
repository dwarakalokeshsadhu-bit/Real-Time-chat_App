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
    <h1>Sign In</h1>{error && <p className="error">{error}</p>}
    <label>
      Email
      <input placeholder="you@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
    </label>
    <label>
      Password
      <input placeholder="Enter your password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
    </label>
    <a className="auth-forgot" href="#forgot" onClick={e => e.preventDefault()}>Forgot password?</a>
    <button>Sign In</button>
    <div className="social-auth">
      <button type="button" onClick={() => loginWithProvider('google')}>Continue with Google</button>
    </div>
    <p>Don't have an account? <button type="button" className="auth-link" onClick={switchMode}>Create one</button></p>
  </form></div>;
}

import React from "react";
import { useState } from 'react';
import { useAuthStore } from '../../store/authSlice';

export default function Register({ switchMode }) {
  const register = useAuthStore(s => s.register);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    try { await register(form.username, form.email, form.password); } catch (err) { setError(err.response?.data?.message || 'Register failed'); }
  }
  return <div className="auth"><form onSubmit={submit}>
    <h1>Create an Account</h1>{error && <p className="error">{error}</p>}
    <label>
      Username
      <input placeholder="Choose a username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
    </label>
    <label>
      Email
      <input placeholder="you@example.com" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
    </label>
    <label>
      Password
      <input placeholder="Create a password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
    </label>
    <button>Create Account</button><p>Already have an account? <button type="button" className="auth-link" onClick={switchMode}>Sign in</button></p>
  </form></div>;
}

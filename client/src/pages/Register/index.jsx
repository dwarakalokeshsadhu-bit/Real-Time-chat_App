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
    <h1>Register</h1>{error && <p className="error">{error}</p>}
    <input placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
    <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
    <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
    <button>Register</button><p onClick={switchMode}>Already have account?</p>
  </form></div>;
}

import { create } from 'zustand';
import { api } from '../api';

export const useAuthStore = create(set => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('accessToken'),
  applyAuthCallback(accessToken, user) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token: accessToken });
  },
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, token: data.accessToken });
  },
  async register(username, email, password) {
    const { data } = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, token: data.accessToken });
  },
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const { data } = await api.post('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user });
    return data.user;
  },
  updateUserAvatar(username, avatarUrl) {
    set(state => {
      if (!state.user || state.user.username !== username) return state;

      const user = { ...state.user, avatarUrl: avatarUrl || '' };
      localStorage.setItem('user', JSON.stringify(user));
      return { user };
    });
  },
  loginWithProvider(provider) {
    window.location.href = `${api.defaults.baseURL}/auth/${provider}`;
  },
  logout() {
    localStorage.clear();
    set({ user: null, token: null });
  }
}));

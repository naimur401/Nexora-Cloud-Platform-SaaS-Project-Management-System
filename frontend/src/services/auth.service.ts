import axios from './axios.config';

export const authService = {
  async login(data: any) {
    const response = await axios.post('/auth/login', data);
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },
  async register(data: any) {
    const response = await axios.post('/auth/register', data);
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },
  async logout() {
    await axios.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};

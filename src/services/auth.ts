import axios from 'axios';
import Cookies from 'js-cookie';
import apiClient from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await axios.post(`${API_URL}/auth/login`, formData);
  
  const { access_token, user_id } = response.data;

  if (access_token) {
    Cookies.set('token', access_token, { expires: 7 });
    if (user_id) {
      Cookies.set('userId', user_id, { expires: 7 });
    }

    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  }

  return response.data;
};

export const logout = () => {
  Cookies.remove('token');
  Cookies.remove('userId');

  delete apiClient.defaults.headers.common['Authorization'];

  window.location.href = '/login';
};
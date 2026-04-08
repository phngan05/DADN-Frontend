import axios from 'axios';
import Cookies from 'js-cookie';
console.log("API: ", process.env.NEXT_PUBLIC_API_URL)

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("token"); // Lấy token từ Cookie
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
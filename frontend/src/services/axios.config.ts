import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Add token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = Bearer ;
    }
    console.log('Axios request:', config.method, config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Log responses
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Axios response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Axios error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default axiosInstance;

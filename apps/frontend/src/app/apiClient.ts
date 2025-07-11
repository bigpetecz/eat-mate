import axios from 'axios';

const isServer = typeof window === 'undefined';

const apiClient = axios.create({
  baseURL: isServer ? process.env.NEXT_API_URL : '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;

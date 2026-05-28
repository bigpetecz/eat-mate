import axios from 'axios';
import { toApiClientError } from '@/lib/api-error';

const baseURL = '/api';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    throw toApiClientError(error);
  }
);

export default apiClient;

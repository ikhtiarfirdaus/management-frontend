// src/api.js
import axios from 'axios';

const API_URL = import.meta.VITE_API_URL || 'https://msmbackend-production-765b.up.railway.app';

export const api = axios.create({
  baseURL: API_URL,
});

export default api;
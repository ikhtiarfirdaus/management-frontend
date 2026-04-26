// src/api.js
import axios from 'axios';

const API_URL = import.meta.VITE_API_URL || 'http://localhost:8083';

const api = axios.create({
  baseURL: API_URL,
});

export default api;
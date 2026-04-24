// src/api.js
import axios from 'axios';

export const api = axios.create({
  baseURL: 'msmbackend-production-765b.up.railway.app', // Sesuaikan dengan port r.Run di main.go
});
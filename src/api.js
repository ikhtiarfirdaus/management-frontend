// src/api.js
import axios from 'axios';

export const api = axios.create({
  baseURL: 'shortline.proxy.rlwy.net:42946', // Sesuaikan dengan port r.Run di main.go
});
// app/api/api.ts
// Axios для Route Handlers: запити йдуть з Next-сервера напряму на бекенд

import axios from "axios";

export const api = axios.create({
  baseURL: process.env.API_URL,
});

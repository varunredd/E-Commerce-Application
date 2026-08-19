import axios from "axios";

// In production (single-origin deploy), VITE_API_URL is empty — API calls go to same origin.
// In development, it points to the local Express server.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
});

export default api;

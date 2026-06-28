import axios, { AxiosError } from "axios";
import type { ApiError } from "../types";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api/v1";

export const api = axios.create({ baseURL });

const TOKEN_KEY = "deskflex_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Attach the bearer token to every request when present.
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize the backend's { errors: [...] } envelope into a single message
// so UI components can render a friendly string without guessing the shape.
export function errorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<ApiError>;
  const list = axiosErr?.response?.data?.errors;
  if (Array.isArray(list) && list.length > 0) {
    return list.join(", ");
  }
  if (axiosErr?.message) return axiosErr.message;
  return "Something went wrong. Please try again.";
}

// Lets the auth layer react to a global 401 (e.g. expired token) by logging out.
export function installUnauthorizedHandler(onUnauthorized: () => void) {
  api.interceptors.response.use(
    (res) => res,
    (error: AxiosError) => {
      if (error.response?.status === 401) onUnauthorized();
      return Promise.reject(error);
    },
  );
}

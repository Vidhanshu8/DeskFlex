import { api } from "./client";
import type { AuthResponse, User } from "../types";

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", {
    user: { email, password },
  });
  return data;
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", { user: input });
  return data;
}

export async function me(): Promise<User> {
  const { data } = await api.get<{ user: User }>("/auth/me");
  return data.user;
}

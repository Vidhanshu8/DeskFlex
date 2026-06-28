import { api } from "./client";
import type { DesksResponse } from "../types";

// Fetches every desk annotated with availability for a given ISO date.
// Optional zone filter is server-side; client-side filters layer on top.
export async function fetchDesks(date: string, zone?: string): Promise<DesksResponse> {
  const { data } = await api.get<DesksResponse>("/desks", {
    params: { date, zone: zone || undefined },
  });
  return data;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export type DeskStatus = "available" | "occupied";

export interface Desk {
  id: number;
  label: string;
  zone: string;
  features: string | null;
  status: DeskStatus;
  booking_id: number | null;
  booked_by_me: boolean;
}

export interface DesksResponse {
  date: string;
  desks: Desk[];
}

export interface Booking {
  id: number;
  desk_id: number;
  user_id: number;
  booking_date: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// The API always returns errors in this envelope: { errors: string[] }
export interface ApiError {
  errors: string[];
}

export interface BookingWithDesk extends Booking {
  desk: { id: number; label: string; zone: string };
}

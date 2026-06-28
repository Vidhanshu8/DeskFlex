import { api } from "./client";
import type { Booking, BookingWithDesk } from "../types";

export async function listBookings(): Promise<BookingWithDesk[]> {
  const { data } = await api.get<{ bookings: BookingWithDesk[] }>("/bookings");
  return data.bookings;
}

export async function createBooking(deskId: number, bookingDate: string): Promise<Booking> {
  const { data } = await api.post<{ booking: Booking }>("/bookings", {
    booking: { desk_id: deskId, booking_date: bookingDate },
  });
  return data.booking;
}

export async function cancelBooking(bookingId: number): Promise<void> {
  await api.delete(`/bookings/${bookingId}`);
}

module Bookings
  # Cancels a reservation. A user may only cancel their own booking; attempting
  # to cancel someone else's returns 403 rather than leaking existence.
  class CancelBooking < ApplicationService
    def initialize(user:, booking_id:)
      @user = user
      @booking_id = booking_id
    end

    def call
      booking = Booking.find_by(id: @booking_id)
      return failure("Booking not found", status: :not_found) if booking.nil?
      return failure("You can only cancel your own bookings", status: :forbidden) unless booking.user_id == @user.id

      booking.destroy
      success(status: :no_content)
    end
  end
end

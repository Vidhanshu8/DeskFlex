module Bookings
  # Reserves a desk for a user on a date. Two layers of protection against
  # double-booking:
  #   1. a model uniqueness validation -> friendly 422 message
  #   2. the DB composite unique index -> guards the race between concurrent
  #      requests, surfaced here as a 409 Conflict.
  class CreateBooking < ApplicationService
    def initialize(user:, desk_id:, booking_date:)
      @user = user
      @desk_id = desk_id
      @booking_date = booking_date
    end

    def call
      desk = Desk.find_by(id: @desk_id)
      return failure("Desk not found", status: :not_found) if desk.nil?

      if Booking.exists?(user_id: @user.id, booking_date: @booking_date)
        return failure("You already have a desk booked for that date", status: :conflict)
      end

      booking = Booking.new(user: @user, desk: desk, booking_date: @booking_date)

      if booking.save
        success({ booking: booking }, status: :created)
      else
        failure(booking.errors.full_messages, status: status_for(booking))
      end
    rescue ActiveRecord::RecordNotUnique
      # Lost a race against a concurrent request (desk- or user-per-day index).
      failure("That booking conflicts with an existing one", status: :conflict)
    end

    private

    def status_for(booking)
      already_booked = booking.errors.details[:desk_id]&.any? { |e| e[:error] == :taken }
      already_booked ? :conflict : :unprocessable_entity
    end
  end
end

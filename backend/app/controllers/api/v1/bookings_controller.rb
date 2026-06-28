module Api
  module V1
    class BookingsController < ApplicationController
      # GET /api/v1/bookings  -> the current user's upcoming reservations
      def index
        bookings = current_user.bookings.upcoming.includes(:desk)
        render_success(
          bookings: bookings.map do |booking|
            BookingSerializer.new(booking).as_json.merge(
              desk: { id: booking.desk.id, label: booking.desk.label, zone: booking.desk.zone }
            )
          end
        )
      end

      # POST /api/v1/bookings  body: { booking: { desk_id, booking_date } }
      def create
        result = Bookings::CreateBooking.call(
          user: current_user,
          desk_id: booking_params[:desk_id],
          booking_date: booking_params[:booking_date]
        )
        render_result(result) do |data|
          { booking: BookingSerializer.new(data[:booking]) }
        end
      end

      # DELETE /api/v1/bookings/:id
      def destroy
        result = Bookings::CancelBooking.call(user: current_user, booking_id: params[:id])
        render_result(result)
      end

      private

      def booking_params
        params.require(:booking).permit(:desk_id, :booking_date)
      end
    end
  end
end

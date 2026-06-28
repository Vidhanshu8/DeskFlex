class BookingSerializer
  def initialize(booking)
    @booking = booking
  end

  def as_json(*)
    {
      id: @booking.id,
      desk_id: @booking.desk_id,
      user_id: @booking.user_id,
      booking_date: @booking.booking_date,
      created_at: @booking.created_at
    }
  end
end

class DeskSerializer
  def initialize(desk, date:, current_user_id: nil)
    @desk = desk
    @date = date
    @current_user_id = current_user_id
  end

  def as_json(*)
    booking = @desk.booking_on(@date)

    {
      id: @desk.id,
      label: @desk.label,
      zone: @desk.zone,
      features: @desk.features,
      status: booking ? "occupied" : "available",
      booking_id: booking&.id,
      booked_by_me: booking.present? && booking.user_id == @current_user_id
    }
  end
end

class Booking < ApplicationRecord
  belongs_to :user
  belongs_to :desk

  validates :booking_date, presence: true
  validate :not_in_the_past, on: :create

  # Application-level guard for a friendly error message. The authoritative
  # guarantee is the composite UNIQUE index on (desk_id, booking_date) in the
  # migration, which closes the race-condition window between two requests.
  validates :desk_id, uniqueness: {
    scope: :booking_date,
    message: "is already booked for that date"
  }

  # A user may hold at most one desk per date. Backed by the unique index on
  # (user_id, booking_date); this validation gives a friendly base-level message.
  validate :one_booking_per_day, on: :create

  scope :for_date, ->(date) { where(booking_date: date) }
  scope :upcoming, -> { where("booking_date >= ?", Date.current).order(:booking_date) }

  private

  def not_in_the_past
    return if booking_date.blank?

    errors.add(:booking_date, "cannot be in the past") if booking_date < Date.current
  end

  def one_booking_per_day
    return if user_id.blank? || booking_date.blank?

    clash = Booking.where(user_id: user_id, booking_date: booking_date)
    clash = clash.where.not(id: id) if persisted?
    errors.add(:base, "You already have a desk booked for that date") if clash.exists?
  end
end

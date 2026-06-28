class Desk < ApplicationRecord
  has_many :bookings, dependent: :destroy

  validates :label, presence: true, uniqueness: { case_sensitive: false }
  validates :zone, presence: true

  scope :by_zone, ->(zone) { where(zone: zone) if zone.present? }
  scope :ordered, -> { order(:zone, :label) }

  def booking_on(date)
    if association(:bookings).loaded?
      bookings.detect { |b| b.booking_date == date }
    else
      bookings.find_by(booking_date: date)
    end
  end
end

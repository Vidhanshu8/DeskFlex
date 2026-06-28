module Desks
  class AvailabilityQuery < ApplicationService
    def initialize(date:, zone: nil)
      @date = date
      @zone = zone
    end

    def call
      return failure("date is invalid or missing", status: :bad_request) if @date.nil?

      desks = Desk.by_zone(@zone)
                  .ordered
                  .includes(:bookings)

      success(date: @date, desks: desks.to_a)
    end
  end
end

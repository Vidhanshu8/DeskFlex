module Api
  module V1
    class DesksController < ApplicationController
      # GET /api/v1/desks?date=YYYY-MM-DD&zone=North
      # The central dashboard endpoint: every desk + its status for that date.
      def index
        result = Desks::AvailabilityQuery.call(date: parsed_date, zone: params[:zone])

        render_result(result) do |data|
          {
            date: data[:date],
            desks: data[:desks].map do |desk|
              DeskSerializer.new(desk, date: data[:date], current_user_id: current_user.id)
            end
          }
        end
      end

      # GET /api/v1/desks/:id?date=YYYY-MM-DD
      def show
        desk = Desk.includes(:bookings).find(params[:id])
        render_success(
          desk: DeskSerializer.new(desk, date: parsed_date, current_user_id: current_user.id)
        )
      end

      private

      # Defaults to today when no date is supplied. Returns nil on a malformed
      # string so the service can answer with a 400.
      def parsed_date
        return Date.current if params[:date].blank?

        Date.iso8601(params[:date])
      rescue ArgumentError
        nil
      end
    end
  end
end

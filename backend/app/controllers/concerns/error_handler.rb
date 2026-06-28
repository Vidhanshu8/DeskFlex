module ErrorHandler
  extend ActiveSupport::Concern

  # A single place that turns exceptions into consistent JSON error envelopes
  # so individual actions never need begin/rescue noise.
  included do
    rescue_from StandardError do |e|
      # Re-raise in dev/test so we keep full stack traces while developing.
      raise e unless Rails.env.production?

      Rails.logger.error("[500] #{e.class}: #{e.message}")
      render_error("Something went wrong", status: :internal_server_error)
    end

    rescue_from ActiveRecord::RecordNotFound do |e|
      render_error(e.message, status: :not_found)
    end

    rescue_from ActiveRecord::RecordInvalid do |e|
      render_error(e.record.errors.full_messages, status: :unprocessable_entity)
    end

    rescue_from ActiveRecord::RecordNotUnique do
      render_error("Resource already exists", status: :conflict)
    end

    rescue_from ActionController::ParameterMissing do |e|
      render_error(e.message, status: :bad_request)
    end

    rescue_from JWT::ExpiredSignature do
      render_error("Token has expired", status: :unauthorized)
    end

    rescue_from JWT::DecodeError do
      render_error("Invalid authentication token", status: :unauthorized)
    end
  end

  private

  # Uniform error shape: { "errors": ["...", "..."] }
  def render_error(messages, status:)
    render json: { errors: Array(messages) }, status: status
  end
end

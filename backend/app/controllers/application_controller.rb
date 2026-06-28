class ApplicationController < ActionController::API
  include ErrorHandler

  # Default: every endpoint requires a valid token. Public endpoints opt out
  # with `skip_before_action :authenticate_request`.
  before_action :authenticate_request

  attr_reader :current_user

  private

  def authenticate_request
    token = bearer_token
    return render_error("Missing authentication token", status: :unauthorized) if token.blank?

    payload = JsonWebToken.decode(token) # raises -> handled by ErrorHandler
    @current_user = User.find_by(id: payload[:user_id])

    render_error("Invalid authentication token", status: :unauthorized) if @current_user.nil?
  end

  def bearer_token
    header = request.headers["Authorization"]
    header.to_s.split(" ").last if header.present?
  end

  # Standard success envelope helper used across API controllers.
  # def render_success(data, status: :ok)
  #   render json: data, status: status
  # end
  def render_success(status: :ok, **data)
  render json: data, status: status
end
  # Renders whatever a ServiceResult carries, mapping success/failure to the
  # status the service chose. Keeps actions to a couple of lines each.
  def render_result(result, success_status: nil, &on_success)
    if result.success?
      payload = block_given? ? on_success.call(result.data) : result.data
      head(result.status) if payload.nil?
      render json: payload, status: (success_status || result.status) unless payload.nil?
    else
      render json: { errors: result.errors }, status: result.status
    end
  end
end

# Lightweight value object every service returns. Controllers branch on
# `result.success?` instead of rescuing exceptions or inspecting models,
# which keeps business outcomes explicit and HTTP mapping trivial.
class ServiceResult
  attr_reader :data, :errors, :status

  def self.success(data = nil, status: :ok)
    new(success: true, data: data, status: status)
  end

  def self.failure(errors, status: :unprocessable_entity)
    new(success: false, errors: Array(errors), status: status)
  end

  def initialize(success:, data: nil, errors: [], status: :ok)
    @success = success
    @data = data
    @errors = errors
    @status = status
  end

  def success?
    @success
  end

  def failure?
    !success?
  end
end

class ApplicationService
  def self.call(...)
    new(...).call
  end

  private

  def success(data = nil, status: :ok, **payload)
    result_data = payload.empty? ? data : (data.is_a?(Hash) ? data.merge(payload) : payload)
    ServiceResult.success(result_data, status: status)
  end

  def failure(errors, status: :unprocessable_entity)
    ServiceResult.failure(errors, status: status)
  end
end

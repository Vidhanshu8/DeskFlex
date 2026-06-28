class JsonWebToken
  ALGORITHM = "HS256".freeze

  class << self
    def encode(payload = {}, exp: 24.hours.from_now, **claims)
      token_payload = payload.to_h.merge(claims)
      token_payload[:exp] = exp.to_i
      JWT.encode(token_payload, secret_key, ALGORITHM)
    end

    # Returns a HashWithIndifferentAccess or raises JWT::DecodeError
    # (handled centrally by the ErrorHandler concern).
    def decode(token)
      decoded, = JWT.decode(token, secret_key, true, algorithm: ALGORITHM)
      ActiveSupport::HashWithIndifferentAccess.new(decoded)
    end

    private

    def secret_key
      ENV.fetch("JWT_SECRET_KEY") do
        Rails.application.secret_key_base
      end
    end
  end
end

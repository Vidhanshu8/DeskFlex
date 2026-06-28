module Auth
  class AuthenticateUser < ApplicationService
    def initialize(email:, password:)
      @email = email.to_s.downcase.strip
      @password = password
    end

    def call
      user = User.find_by(email: @email)

      return failure("Invalid email or password", status: :unauthorized) unless user&.authenticate(@password)

      success(user: user, token: JsonWebToken.encode(user_id: user.id))
    end
  end
end

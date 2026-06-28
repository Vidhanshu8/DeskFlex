module Auth
  class RegisterUser < ApplicationService
    def initialize(name:, email:, password:, password_confirmation: nil)
      @name = name
      @email = email.to_s.downcase.strip
      @password = password
      @password_confirmation = password_confirmation || password
    end

    def call
      user = User.new(
        name: @name,
        email: @email,
        password: @password,
        password_confirmation: @password_confirmation
      )

      return failure(user.errors.full_messages) unless user.save

      success({ user: user, token: JsonWebToken.encode(user_id: user.id) }, status: :created)
    end

    private

    attr_reader :email, :name, :password, :password_confirmation
  end
end

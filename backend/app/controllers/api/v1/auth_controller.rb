module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_request, only: %i[register login]

      def register
        result = Auth::RegisterUser.call(**register_params.to_h.symbolize_keys)
        render_result(result) do |data|
          { user: UserSerializer.new(data[:user]), token: data[:token] }
        end
      end

      def login
        result = Auth::AuthenticateUser.call(
          email: login_params[:email],
          password: login_params[:password]
        )
        render_result(result) do |data|
          { user: UserSerializer.new(data[:user]), token: data[:token] }
        end
      end

      def me
        render_success(user: UserSerializer.new(current_user))
      end

      private

      def register_params
        params.require(:user).permit(:name, :email, :password, :password_confirmation)
      end

      def login_params
        params.require(:user).permit(:email, :password)
      end
    end
  end
end

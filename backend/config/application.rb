require_relative "boot"

require "rails"
# Pick only the frameworks we actually need for a JSON API.
require "active_model/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_view/railtie"

# Require the gems listed in Gemfile, including any gems
# limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Deskflex
  class Application < Rails::Application
    config.load_defaults 7.1

    # API-only application: no cookies, sessions, or view middleware.
    config.api_only = true

    # Autoload lib/ (e.g. JsonWebToken) but ignore non-reloadable subdirs.
    config.autoload_lib(ignore: %w[assets tasks])

    # Default response format for generated/scaffolded code.
    config.generators do |g|
      g.test_framework :rspec
    end

    # Keep all errors as JSON via the ErrorHandler concern + custom exceptions.
    config.action_dispatch.rescue_responses["ActiveRecord::RecordNotUnique"] = :conflict
  end
end

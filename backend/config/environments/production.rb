require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false
  config.action_controller.perform_caching = true

  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")
  config.log_tags = [:request_id]
  config.logger = ActiveSupport::TaggedLogging.new(Logger.new($stdout))

  config.active_record.dump_schema_after_migration = false
  config.active_support.report_deprecations = false

  config.force_ssl = ENV.fetch("FORCE_SSL", "true") == "true"
  config.i18n.fallbacks = true
end

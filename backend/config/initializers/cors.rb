# Allows the React frontend to call this API from the browser.
# Origins are read from FRONTEND_ORIGIN (comma-separated) with a dev default.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*ENV.fetch("FRONTEND_ORIGIN", "http://localhost:5173").split(","))

    resource "*",
      headers: :any,
      expose: ["Authorization"],
      methods: %i[get post put patch delete options head]
  end
end

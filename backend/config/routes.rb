Rails.application.routes.draw do
  # Health check used by load balancers / uptime monitors.
  get "up", to: ->(_env) { [200, { "Content-Type" => "application/json" }, ['{"status":"ok"}']] }

  namespace :api do
    namespace :v1 do
      # --- Authentication ---
      post "auth/register", to: "auth#register"
      post "auth/login",    to: "auth#login"
      get  "auth/me",       to: "auth#me"

      # --- Desks ---
      # GET /api/v1/desks?date=YYYY-MM-DD returns every desk with its
      # availability for that date (the core dashboard query).
      resources :desks, only: %i[index show]

      # --- Bookings ---
      resources :bookings, only: %i[index create destroy]
    end
  end
end

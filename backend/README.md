# DeskFlex — Backend (Rails API)

Ruby on Rails 7.1 (API-only) + PostgreSQL. See the [root README](../README.md) for
the full overview, architecture, and API reference.

## Quickstart
```bash
bundle install
cp .env.example .env          # set DB creds + a JWT secret (bin/rails secret)
bin/rails db:create db:migrate db:seed
bin/rails server              # http://localhost:3001
```

## Layout
```
app/
  controllers/api/v1/   thin controllers (no queries)
  services/             business logic + queries (Auth::, Desks::, Bookings::)
  serializers/          JSON shaping
  models/               validations, scopes, relationships
  controllers/concerns/ ErrorHandler (centralized rescue_from)
lib/json_web_token.rb   JWT encode/decode
db/migrate/             users, desks, bookings (+ unique index)
```

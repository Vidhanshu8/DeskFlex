# Rails API image. Built on the user's machine where the network is available,
# so `bundle install` runs at build time.
FROM ruby:3.2.2-slim

ENV RAILS_ENV=development \
    BUNDLE_PATH=/usr/local/bundle \
    LANG=C.UTF-8

# System deps: build toolchain for native gems + libpq for the pg gem.
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential libpq-dev postgresql-client git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install gems first so this layer is cached unless the Gemfile changes.
# Gemfile.lock is optional on first build; bundler generates it if absent.
COPY Gemfile* ./
RUN bundle install

COPY . .

RUN chmod +x bin/docker-entrypoint bin/rails bin/rake bin/setup

ENTRYPOINT ["bin/docker-entrypoint"]
EXPOSE 3001
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3001"]

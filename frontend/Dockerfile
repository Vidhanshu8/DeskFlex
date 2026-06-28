# React + Vite dev image. `npm install` runs at build time on the user's machine.
FROM node:20-slim

WORKDIR /app

# Install deps first for layer caching. package-lock.json is optional on first build.
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
# --host binds 0.0.0.0 so the dev server is reachable from outside the container.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

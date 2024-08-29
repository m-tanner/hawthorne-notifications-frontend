# Stage 1: Build the Next.js app
FROM node:20-alpine AS build

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Set the working directory in the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml (PNPM's lock file)
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN pnpm run build

# Stage 2: Set up the server with Distroless
FROM node:20-slim

# Set working directory inside the container
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules

# Command to start the Next.js server
CMD ["node_modules/.bin/next", "start"]

# Stage 1: Build the React app
FROM node:20-alpine AS build

# Set environment variables for the build process
ARG REACT_APP_FRONTEND_BASE_URL

# Step 2: Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build

# Stage 2: Set up the Express server with Distroless
FROM gcr.io/distroless/nodejs20

# Set working directory inside the container
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY src/server.js .

# Command to start the server
CMD ["server.js"]

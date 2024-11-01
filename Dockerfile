# Use the official Node.js 20 image from Docker Hub
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Hard-code environment variables directly
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL="http://41.216.183.160:9000"
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY="pk_b07a4a6af47b1b2c8bc3c0f4d46992ef74ac5ded1a5d889996fc661b0f6287d2"
ENV NEXT_PUBLIC_BASE_URL="https://playersclubla-storefront.vercel.app"
ENV NEXT_PUBLIC_DEFAULT_REGION="us"

# Copy package.json and package-lock.json for dependency installation
COPY package.json ./
RUN npm install
# Install dependencies


# Copy the rest of your application code
COPY . .
RUN npm run build
# Build the Next.js app


# Expose port 8000 if running locally
EXPOSE 8000

# Start the application
CMD ["npm", "start"]

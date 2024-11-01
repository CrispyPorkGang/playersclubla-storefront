# Use the official Node.js 20 image from Docker Hub
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port 3000 if running locally
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]

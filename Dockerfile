# Use an official Node.js runtime as the base image
FROM node:16

# Set the working directory in the Docker image
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the Docker image
COPY package*.json ./

# Install the project dependencies
RUN npm install

RUN npm install -g typescript

# Copy the rest of the application code into the Docker image
COPY . .

# Compile TypeScript code to JavaScript
RUN npm run build

# Set the command to run your application
CMD [ "node", "dist/main.js" ]

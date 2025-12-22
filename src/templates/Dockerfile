# --- Generic Dockerfile Template ---

# 1. Choose a base image that matches your application's language and framework.
# Example for Node.js:
FROM node:18-alpine

# 2. Set the working directory inside the container.
WORKDIR /usr/src/app

# 3. Copy dependency files and install dependencies.
# This is done in a separate step to leverage Docker's layer caching.
# Example for Node.js:
COPY package*.json ./
RUN npm install

# 4. Copy the rest of your application's source code.
COPY . .

# 5. Build your application (if necessary).
# Example for a Node.js project that needs compilation:
# RUN npm run build

# 6. Expose the port your application runs on.
EXPOSE 3000

# 7. Define the command to run your application.
# Example for a Node.js project:
CMD [ "node", "dist/main.js" ]

FROM ghcr.io/puppeteer/puppeteer:22.7.1

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

# Install dependencies required for Puppeteer
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the local npm package and install it
COPY leetcode-query-1.2.3.tgz ./
RUN npm install ./leetcode-query-1.2.3.tgz

# Copy the rest of the application code
COPY . .

# Set appropriate ownership and permissions for the app directory
RUN chown -R pptruser:pptruser /usr/src/app

# Switch to non-root user
USER pptruser

# Start the application
CMD ["node", "index.js"]

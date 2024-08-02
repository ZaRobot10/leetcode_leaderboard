FROM ghcr.io/puppeteer/puppeteer:22.7.1

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies as root user
USER root
RUN npm ci

# Copy the local npm package and install it
COPY leetcode-query-1.2.3.tgz ./
RUN npm install ./leetcode-query-1.2.3.tgz

# Copy the rest of the application code
COPY . .

CMD ["node", "index.js"]

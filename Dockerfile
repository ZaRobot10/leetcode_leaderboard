FROM ghcr.io/puppeteer/puppeteer:22.7.1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./
USER root
RUN npm ci
RUN npm install git+https://github.com/ZaRobot10/leetcode_query_updated.git
COPY . .
CMD [ "node", "index.js" ]

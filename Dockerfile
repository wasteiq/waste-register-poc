# Stage 1 - the build process
FROM node:12.16.1 AS build-deps
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn
COPY tsconfig.json server_tsconfig.json ./
COPY src ./src
COPY server ./server
COPY src/public ./public
RUN yarn build
RUN yarn run build:server

# Stage 2 - the production environment
FROM node:12.16.1-alpine
WORKDIR code
COPY package.json yarn.lock index.js ./
RUN yarn install --production
COPY --from=build-deps /usr/src/app/build ./build
COPY --from=build-deps /usr/src/app/server_build ./server_build
EXPOSE 3000
ENV port 3000
CMD ["node", "index"]

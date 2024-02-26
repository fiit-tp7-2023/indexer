FROM node:16-alpine AS node
FROM node AS node-with-gyp
RUN apk add g++ make python3
FROM node-with-gyp AS builder
WORKDIR /mnt/disk/squid/indexer
ADD package.json .
ADD package-lock.json .
# remove if needed
ADD assets assets
# remove if needed
ADD db db
# remove if needed
ADD schema.graphql .
RUN npm ci
ADD tsconfig.json .
ADD src src
RUN npm run build
FROM node-with-gyp AS deps
WORKDIR /mnt/disk/squid/indexer
ADD package.json .
ADD package-lock.json .
RUN npm ci --production
FROM node AS squid
WORKDIR /mnt/disk/squid/indexer
COPY --from=deps /mnt/disk/squid/indexer/package.json .
COPY --from=deps /mnt/disk/squid/indexer/package-lock.json .
COPY --from=deps /mnt/disk/squid/indexer/node_modules node_modules
COPY --from=builder /mnt/disk/squid/indexer/lib lib
# remove if no assets folder
COPY --from=builder /mnt/disk/squid/indexer/assets assets
# remove if no db folder
COPY --from=builder /mnt/disk/squid/indexer/db db
# remove if no schema.graphql is in the root
COPY --from=builder /mnt/disk/squid/indexer/schema.graphql schema.graphql
# remove if no commands.json is in the root
ADD commands.json .
RUN echo -e "loglevel=silent\\nupdate-notifier=false" > /mnt/disk/squid/indexer/.npmrc
RUN npm i -g @subsquid/commands && mv $(which squid-commands) /usr/local/bin/sqd
ENV PROCESSOR_PROMETHEUS_PORT 3001

FROM node:22-alpine
WORKDIR /app/game

COPY game/package.json game/package-lock.json ./
RUN npm ci

COPY shared/types ../shared/types
COPY game/ .

EXPOSE 3002
CMD ["npm", "start"]
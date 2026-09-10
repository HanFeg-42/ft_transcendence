FROM node:22-alpine
WORKDIR /app

COPY game/package.json game/package-lock.json ./
RUN npm ci

COPY shared/game-types.ts ./shared/game-types.ts
COPY game/ .

# Adjust port EXPOSE per service 
EXPOSE 3002
CMD ["npm", "start"]
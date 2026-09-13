FROM node:22-alpine
WORKDIR /app/chat

COPY chat/package.json chat/package-lock.json ./
RUN npm ci

COPY shared/types ../shared/types
COPY chat/ .

EXPOSE 3003
CMD ["npm", "start"]
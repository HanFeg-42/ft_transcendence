FROM node:22-alpine
WORKDIR /app/user

COPY user/package.json user/package-lock.json ./
RUN npm ci

COPY shared/types ../shared/types
COPY user/ .

EXPOSE 3004
CMD ["npm", "start"]
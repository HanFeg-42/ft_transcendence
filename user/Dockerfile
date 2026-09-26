FROM node:22-alpine
WORKDIR /app/user

COPY user/package.json user/package-lock.json ./
RUN npm ci

COPY shared/types ../shared/types
COPY user/ .
RUN npx prisma generate

EXPOSE 3004
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
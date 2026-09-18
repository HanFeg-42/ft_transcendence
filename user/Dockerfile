FROM node:22-alpine
WORKDIR /app/user

COPY user/package.json user/package-lock.json ./
RUN npm ci

COPY shared/types ../shared/types
COPY user/ .

# Générer le client Prisma dans src/generated/prisma
RUN npx prisma generate

EXPOSE 3004

# Synchroniser la base PostgreSQL au démarrage puis lancer l'app
CMD ["sh", "-c", "npx prisma db push && npm start"]
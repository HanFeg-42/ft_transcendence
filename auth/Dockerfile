FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# RUN npx prisma generate <-- commented out until auth/prisma/schema.prisma exists


EXPOSE 3001
CMD ["npm", "start"]
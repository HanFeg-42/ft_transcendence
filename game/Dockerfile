FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Adjust port EXPOSE per service 
EXPOSE 3002
CMD ["npm", "start"]
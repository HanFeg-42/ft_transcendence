FROM node:22-alpine AS builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY shared/types ../shared/types
COPY frontend/ .
RUN npm run build

FROM nginx:alpine AS runner
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/certs/key.pem \
    -out /etc/nginx/certs/cert.pem \
    -subj "/C=MA/ST=Souss-Massa/L=Agadir/O=42/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/nginx.conf

EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
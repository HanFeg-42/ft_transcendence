# Technical Architecture Specification

**Project:** ft_transcendence — Pacova  
**Architecture:** PERN Stack Microservices Monorepo  
**Target Environment:** Docker-containerized application

> This document describes the architecture currently implemented in the project. Planned features are explicitly marked as future work and must not be interpreted as already implemented.

---

## 1. Current System Overview

Pacova currently follows this request path:

```text
                         Browser
                            |
                            | HTTPS :443
                            v
                  +-------------------+
                  |     Frontend      |
                  | React/Vite + Nginx|
                  | TLS termination   |
                  +---------+---------+
                            |
                            | /api/*
                            v
                  +-------------------+
                  |    API Gateway    |
                  |      Node.js      |
                  +---------+---------+
                            |
                  +---------+---------+
                  |                   |
                  v                   v
          +---------------+   +---------------+
          |     Auth      |   |     Game      |
          | Express + TS  |   | Node service  |
          | Prisma + JWT  |   |               |
          +-------+-------+   +-------+-------+
                  |                   |
                  +---------+---------+
                            |
                            v
                  +-------------------+
                  |    PostgreSQL     |
                  | auth_db / game_db |
                  +-------------------+
```

The application currently consists of five Docker services:

- `frontend`
- `api-gateway`
- `auth`
- `game`
- `postgres`

All services communicate through the same custom Docker bridge network:

```text
pacova
```

Only the frontend publishes the application's HTTPS port to the host.

---

## 2. Container Responsibilities

### 2.1 Frontend (`frontend`)

The frontend is the public entry point of the application.

Its responsibilities currently include:

- Hosting the React/Vite frontend.
- Serving the built frontend through Nginx.
- Terminating HTTPS/TLS.
- Forwarding `/api/*` requests to the API Gateway.
- Keeping internal backend services hidden from direct browser access.

The host exposes:

```text
443:443
```

The browser therefore communicates with the application through:

```text
https://localhost
```

Backend requests use paths such as:

```text
/api/auth/register
/api/auth/login
/api/auth/me
```

Nginx forwards `/api/*` traffic to the API Gateway.

---

### 2.2 API Gateway (`api-gateway`)

The API Gateway is the routing layer between the frontend/Nginx boundary and backend services.

Its current responsibilities include:

- Receiving API requests forwarded by Nginx.
- Routing authentication requests to the Auth service.
- Routing requests for other backend domains to their corresponding services.
- Keeping service addresses internal to Docker.

For authentication, the request path is conceptually:

```text
Browser
   |
   v
Nginx
   |
   | /api/auth/*
   v
API Gateway
   |
   | /auth/*
   v
Auth service
```

The current gateway strips the `/auth` prefix before forwarding requests to the Auth service.

For example:

```text
/api/auth/login
       |
       v
Nginx removes /api/
       |
       v
/auth/login
       |
       v
Gateway removes /auth
       |
       v
/login
```

JWT authentication for the currently implemented protected Auth routes is performed by the Auth service middleware.

Gateway-level authentication enforcement may be introduced later where appropriate, but it must not be documented as implemented until the corresponding code exists.

---

### 2.3 Auth Service (`auth`)

The Auth service owns the currently implemented user authentication functionality.

Technology currently used includes:

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- `bcryptjs`
- `jsonwebtoken`

Current responsibilities include:

- User registration.
- Basic backend registration validation.
- Password hashing with bcrypt.
- User login.
- Password verification.
- JWT issuance.
- JWT verification middleware.
- Protected authenticated-user lookup through `GET /me`.
- Access to authentication data stored in `auth_db`.

Current Auth endpoints include:

```http
POST /register
POST /login
GET /me
```

`GET /me` requires a valid JWT.

Features such as 42 OAuth and 2FA are planned authentication work and are not part of the current implementation.

---

### 2.4 Game Service (`game`)

The Game service is the backend boundary reserved for game-related functionality.

It has its own service container and database connection configuration.

The detailed real-time multiplayer game engine, matchmaking, WebSocket protocol, authoritative game loop, and game persistence model are developed incrementally in later work.

Those features should not be described as implemented until their corresponding code has been integrated.

---

### 2.5 PostgreSQL (`postgres`)

PostgreSQL provides persistent relational storage for backend services.

The current architecture uses one PostgreSQL server/container with logically separate databases:

```text
auth_db
game_db
```

This gives the project one database server while preserving ownership boundaries between application domains.

The Auth service uses:

```text
auth_db
```

The Game service uses:

```text
game_db
```

Database data is persisted using a Docker named volume.

---

## 3. Docker Networking

All application services currently share one custom Docker bridge network:

```text
pacova
```

Docker provides internal DNS resolution using service names.

This allows containers to communicate using names such as:

```text
postgres
auth
game
api-gateway
frontend
```

rather than hardcoded container IP addresses.

The architecture is therefore:

```text
Host
 |
 | :443
 v
frontend
 |
 v
api-gateway
 |        |
 v        v
auth     game
 |        |
 +---+----+
     |
     v
 postgres
```

Backend service ports are not unnecessarily published to the host.

The frontend is the public application boundary.

---

## 4. HTTPS and Nginx Routing

Nginx runs as part of the frontend service and provides the external HTTPS entry point.

The browser communicates over HTTPS:

```text
Browser
   |
   | HTTPS :443
   v
Nginx
```

API requests use the `/api/` prefix.

Conceptually:

```nginx
location /api/ {
    proxy_pass http://api-gateway:3000/;
}
```

This means a browser request such as:

```text
https://localhost/api/auth/login
```

is forwarded internally to the API Gateway.

The browser does not need to know the Docker hostname or internal port of the Auth service.

---

## 5. Authentication Request Flow

### 5.1 Registration

The implemented registration path is:

```text
Browser
   |
   | POST /api/auth/register
   v
Nginx
   |
   v
API Gateway
   |
   v
Auth service
   |
   v
Input validation
   |
   v
bcrypt.hash()
   |
   v
Prisma
   |
   v
auth_db
```

Passwords are hashed before persistence.

Plaintext passwords are not stored in PostgreSQL.

---

### 5.2 Login

The implemented login path is:

```text
Browser
   |
   | POST /api/auth/login
   v
Nginx
   |
   v
API Gateway
   |
   v
Auth service
   |
   v
Find user with Prisma
   |
   v
bcrypt.compare()
   |
   v
Credentials valid?
   |
   v
jwt.sign()
   |
   v
JWT returned
```

Invalid emails and invalid passwords return the same generic authentication error.

---

### 5.3 Protected Requests

Authenticated API requests send the access token using:

```http
Authorization: Bearer <JWT>
```

The token must not be sent through URL query parameters.

For the current protected Auth route:

```text
GET /api/auth/me
        |
        v
Nginx
        |
        v
API Gateway
        |
        v
Auth service
        |
        v
JWT middleware
        |
        v
jwt.verify()
        |
        v
Extract verified userId
        |
        v
Prisma user lookup
        |
        v
Safe user profile
```

The Auth service currently performs JWT verification for this route.

---

## 6. JWT Security Model

The current JWT payload is intentionally minimal:

```json
{
  "userId": 1
}
```

Sensitive information such as passwords, password hashes, and the signing secret must never be placed in the payload.

Tokens are signed with:

```text
HS256
```

and expire after:

```text
1 hour
```

The Auth service explicitly restricts verification to the expected algorithm.

The signing secret is provided through:

```text
JWT_SECRET
```

The real secret belongs in `.env` and must not be committed.

A secure random development secret can be generated with:

```bash
openssl rand -hex 32
```

This command generates the **JWT signing secret**, not the JWT itself.

JWTs are created by the application using:

```ts
jwt.sign(...)
```

The committed `.env.example` contains only a placeholder:

```env
JWT_SECRET=replace_with_a_secure_random_secret
```

---

## 7. Database Architecture

### 7.1 Logical Database Separation

The PostgreSQL instance currently contains separate logical databases:

```text
PostgreSQL
├── auth_db
└── game_db
```

The purpose of this separation is to keep data ownership clear even though both domains use the same PostgreSQL server.

The intended ownership rule is:

```text
Auth service  ---> auth_db
Game service  ---> game_db
```

Services should not bypass their ownership boundaries by directly manipulating another service's data.

---

### 7.2 Auth Database and Prisma

The Auth service owns its Prisma schema and migrations.

The currently implemented `User` model contains:

```text
User
├── id
├── username
├── email
├── passwordHash
└── createdAt
```

The current schema must be treated as the source of truth for implemented Auth fields.

Future fields such as avatars, OAuth identities, 2FA secrets, friendship data, or other profile information must be introduced through explicit schema changes and migrations when those features are implemented.

---

### 7.3 Persistence

PostgreSQL storage is backed by a Docker named volume.

This allows database data to survive normal container recreation.

Database schema changes are managed through Prisma migrations owned by the relevant service.

For Auth, committed migrations can be applied using:

```bash
npx prisma migrate deploy
```

---

## 8. Environment Variables and Secrets

Configuration is provided to services through environment variables.

The project uses:

```text
.env
```

for real local configuration.

This file must remain ignored by Git.

The project also commits:

```text
.env.example
```

which contains safe placeholders showing developers which values must be configured.

Examples include:

```env
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=postgres

AUTH_DATABASE_URL=postgresql://your_postgres_user:your_postgres_password@postgres:5432/auth_db
GAME_DATABASE_URL=postgresql://your_postgres_user:your_postgres_password@postgres:5432/game_db

JWT_SECRET=replace_with_a_secure_random_secret
```

Real credentials and secrets must never be committed.

---

## 9. Current Security Decisions

The architecture currently applies the following security decisions:

- External application traffic enters through HTTPS.
- Internal service addresses are hidden behind Nginx and the API Gateway.
- Passwords are hashed with bcrypt before storage.
- Plaintext passwords are not persisted.
- Login uses a generic invalid-credentials response.
- JWT payloads contain only the minimum identity information currently required.
- JWTs expire.
- JWT signing and verification use an explicitly selected algorithm.
- JWTs are verified before protected Auth routes trust their payload.
- Protected HTTP requests use the `Authorization: Bearer <JWT>` header.
- JWTs are not placed in URL query parameters.
- Real secrets are stored outside source control in `.env`.
- API responses do not expose `passwordHash`.

Additional protections such as login rate limiting, 2FA, OAuth security controls, and broader authorization rules remain future work.

---

## 10. Current Docker Compose Topology

The current Compose architecture is conceptually:

```yaml
services:
  postgres:
    # PostgreSQL database server

  auth:
    # Authentication service
    # Depends on healthy PostgreSQL

  game:
    # Game service
    # Depends on healthy PostgreSQL

  api-gateway:
    # Internal routing layer
    # Depends on backend services

  frontend:
    # Nginx + frontend
    # Publishes HTTPS 443
    # Proxies API requests to api-gateway
```

All services join:

```text
pacova
```

The database uses a persistent named volume.

The exact Compose file remains the source of truth for image versions, health checks, dependency rules, and runtime configuration.

---

## 11. Current vs Planned Features

To keep architecture documentation accurate, implemented functionality is separated from planned functionality.

### Implemented

- Docker Compose application structure.
- Frontend/Nginx HTTPS entry point.
- API Gateway routing.
- Auth service.
- Game service container boundary.
- PostgreSQL.
- `auth_db` and `game_db`.
- Prisma integration for Auth.
- User registration.
- bcrypt password hashing.
- User login.
- Password verification.
- JWT issuance.
- JWT verification middleware.
- Protected `/me` route.

### Planned / Future Work

- 42 OAuth.
- Two-factor authentication.
- Refresh-token/session strategy.
- Login rate limiting.
- Friends/social features.
- WebSocket authentication.
- Real-time multiplayer game protocol.
- Authoritative game loop.
- Matchmaking.
- Chat.
- Game statistics and history.
- Broader authorization rules.

Planned functionality should be added to the implemented section only after it exists in the repository and has been tested.

---

## 12. Future WebSocket Architecture

Real-time features are planned, but the exact WebSocket authentication and routing implementation must follow the code that is eventually adopted.

The expected high-level path is:

```text
Browser
   |
   | WSS
   v
Nginx
   |
   v
API Gateway
   |
   v
Relevant real-time service
```

Authentication must be performed before an unauthenticated client is allowed to access protected real-time functionality.

JWTs must not be passed through URL query parameters.

The exact handshake mechanism, token transport, reconnection behavior, and socket context structure will be documented when WebSocket integration is implemented.

---

## 13. Architectural Principles

The project should continue following these principles:

### One public entry point

The browser should communicate through the HTTPS frontend/Nginx boundary instead of directly addressing internal backend services.

### Service ownership

Each backend service owns its own responsibilities and data.

### No hardcoded container IP addresses

Docker service names provide internal DNS resolution.

### Database changes through migrations

Persistent schema changes should be reproducible through committed migrations.

### Secrets outside Git

Credentials, JWT secrets, OAuth secrets, and similar values must never be committed.

### Documentation follows implementation

Architecture documentation must describe the repository as it exists.

Future designs should be clearly marked as planned rather than written as completed functionality.

---

## 14. Current End-to-End Topology

```text
                         +----------------------+
                         |       Browser        |
                         +----------+-----------+
                                    |
                                    | HTTPS :443
                                    v
                         +----------------------+
                         |       Frontend       |
                         |   React/Vite/Nginx   |
                         |    TLS + /api proxy  |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         |     API Gateway      |
                         |      Node.js         |
                         +-----+-----------+----+
                               |           |
                         /auth |           | game routes
                               |           |
                               v           v
                    +---------------+  +---------------+
                    |     Auth      |  |     Game      |
                    | Express + TS  |  | Game boundary |
                    | Prisma        |  |               |
                    | bcrypt + JWT  |  |               |
                    +-------+-------+  +-------+-------+
                            |                  |
                            +--------+---------+
                                     |
                                     v
                         +----------------------+
                         |      PostgreSQL      |
                         |  auth_db / game_db   |
                         |  persistent volume   |
                         +----------------------+

All containers communicate through the `pacova` Docker bridge network.
Only HTTPS port 443 is published as the application's public entry point.
```

---

## 15. Architecture Status

The architecture is intentionally incremental.

The current foundation provides:

```text
HTTPS entry point
      |
      v
API routing
      |
      +--> Authentication
      |       |
      |       +--> Registration
      |       +--> Login
      |       +--> JWT
      |       +--> Protected routes
      |
      +--> Game service boundary
              |
              v
        Future real-time work
```

This document should be updated whenever a planned architectural component becomes implemented so that it remains a description of the real system rather than an outdated design proposal.

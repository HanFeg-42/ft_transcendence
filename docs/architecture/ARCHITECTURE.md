# TECHNICAL ARCHITECTURE SPECIFICATION DOCUMENT
**Project:** ft_transcendence (Multiplayer Pac-Man Platform)  
**Architecture:** PERN Stack Microservices Monorepo  
**Target Environment:** Docker Containerized Infrastructure  

---

### 1. SYSTEM INTERNALS & CONTAINER RESPONSIBILITIES

#### 1.1 Frontend Container (`frontend`)
*   **Base Runtime / Technology:** Node.js 20 (Alpine Linux base), Vite, React 18 (TypeScript), Tailwind CSS. Served in production via Nginx (Alpine base).
*   **Functional Role:** Single Page Application (SPA) delivery engine. Handles client-side routing, user interface rendering, canvas-based rendering for 2D Multiplayer Pac-Man (30-FPS frame interpolation), Web-Socket event listeners for dynamic UI/chat updates, and client-side JWT persistence (HTTP-only secure cookie interface).
*   **Key Dependencies:** `react`, `react-dom`, `react-router-dom`, `socket.io-client`, `axios`, `lucide-react`, `tailwindcss`.

#### 1.2 API Gateway Container (`api-gateway`)
*   **Base Runtime / Technology:** Node.js 20 (Alpine Linux base), Express.js (TypeScript), `http-proxy-middleware`.
*   **Functional Role:** Central ingress router and reverse proxy. Implements security enforcement including JWT verification, rate limiting, and CORS headers validation. Routes incoming HTTP requests and Web-Socket connection upgrade requests to internal backend microservices based on URI path patterns. Terminates public traffic boundary.
*   **Key Dependencies:** `express`, `http-proxy-middleware`, `jsonwebtoken`, `express-rate-limit`, `cors`, `cookie-parser`, `dotenv`.

#### 1.3 Authentication & User Service Container (`auth-service`)
*   **Base Runtime / Technology:** Node.js 20 (Alpine Linux base), Express.js (TypeScript), Prisma ORM.
*   **Functional Role:** User identity lifecycle management. Handles 42 OAuth2 authentication flow, local credential registration/login, two-factor authentication (2FA/TOTP), JWT issuance and validation, user profile updates, friend lists, blocklists, and user presence state tracking.
*   **Key Dependencies:** `express`, `@prisma/client`, `prisma`, `jsonwebtoken`, `bcryptjs`, `otplib`, `qrcode`, `axios`.

#### 1.4 Game & Chat Engine Service Container (`game-service`)
*   **Base Runtime / Technology:** Node.js 20 (Alpine Linux base), Express.js (TypeScript), Socket.io, Prisma ORM.
*   **Functional Role:** Hosts real-time game logic loop (30-FPS tick rate) for multiplayer Pac-Man, collision detection, ghost AI behavior, score aggregation, matchmaking queues, and player lobby state. Manages real-time global, private, and channel-based chat routing, block enforcement in real-time streams, and game match history persistence.
*   **Key Dependencies:** `express`, `socket.io`, `@prisma/client`, `prisma`, `jsonwebtoken`, `zod`.

#### 1.5 Database Container (`postgres-db`)
*   **Base Runtime / Technology:** PostgreSQL 16 (Alpine Linux base).
*   **Functional Role:** Relational data storage engine hosting isolated physical databases (`auth_db` and `game_db`). Enforces data persistence, ACID transactions, foreign key constraints, and index optimizations.
*   **Key Dependencies:** Standard PostgreSQL binaries, custom entrypoint initialization scripts shell-executed on initial initialization.

---

### 2. DOCKER NETWORKING STRATEGY

#### 2.1 Public Network Layer (`frontend-network`)
*   **Bridged Containers:** `frontend`, `api-gateway`.
*   **Exposed Ports:** 
    *   `80:80` (Standard HTTP traffic routed to Gateway/Nginx).
    *   `443:443` (HTTPS TLS termination at Gateway/Nginx).
    *   `5173:5173` (Development mode Vite HMR port — disabled in production deployment).
*   **Traffic Topology:** External clients submit HTTP/HTTPS and WebSocket upgrade requests targeting port 80/443. Traffic enters `frontend-network` exclusively via the `api-gateway` or direct static content requests served by `frontend`.

#### 2.2 Private Network Layer (`backend-network`)
*   **Isolated Containers:** `api-gateway`, `auth-service`, `game-service`, `postgres-db`.
*   **Internal DNS Mapping:** Docker's embedded DNS engine maps container names directly to service hostnames within the bridge namespace:
    *   `http://auth-service:5001`
    *   `http://game-service:5002`
    *   `postgres-db:5432`
*   **Traffic Topology:** Internal REST calls between services and persistent TCP database sockets travel exclusively across this network interface. `frontend` is explicitly disconnected from `backend-network`.

#### 2.3 Network Security Constraints & Isolation Matrix
*   **Zero Database Visibility:** `postgres-db` binds no host ports (`ports` block omitted in `docker-compose.yml`). Database port `5432` is accessible strictly to containers residing inside `backend-network`.
*   **Direct Microservice Blockade:** `auth-service` (port 5001) and `game-service` (port 5002) do not expose public host ports. Direct host-to-service ingress bypass attempts are rejected at the network driver level.
*   **Gateway Ingress Filtering:** All network ingress to backend microservices must pass through `api-gateway`. The gateway verifies structural validity and cryptographic authenticity of request tokens prior to proxying downstream across `backend-network`.

```
[ Client Browser ]
        │
   (Port 80/443)
        │
┌───────▼─────────────────────────────────────────┐
│ FRONTEND NETWORK (Public)                       │
│  ┌──────────────┐         ┌──────────────────┐  │
│  │   frontend   │         │   api-gateway    │  │
│  └──────────────┘         └─────────┬────────┘  │
└─────────────────────────────────────┼───────────┘
                                      │
┌─────────────────────────────────────▼───────────┐
│ BACKEND NETWORK (Private)                       │
│  ┌────────────────┐       ┌──────────────────┐  │
│  │  auth-service  │       │   game-service   │  │
│  └────────┬───────┘       └─────────┬────────┘  │
│           │                         │           │
│           └───────────┐ ┌───────────┘           │
│                       ▼ ▼                       │
│              ┌──────────────────┐               │
│              │   postgres-db    │               │
│              └──────────────────┘               │
└─────────────────────────────────────────────────┘
```

---

### 3. RELATIONAL DATABASE TOPOPHILY & MIGRATIONS

#### 3.1 Multi-Database Initialization Strategy
The single `postgres-db` instance initializes separate physical logical databases (`auth_db` and `game_db`) upon initial container creation via custom initialization scripts located at `/docker-entrypoint-initdb.d/init-databases.sh`:

```bash
#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE auth_db;
    CREATE DATABASE game_db;
    GRANT ALL PRIVILEGES ON DATABASE auth_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE game_db TO $POSTGRES_USER;
EOSQL
```

#### 3.2 Schema Isolation via Prisma ORM
To guarantee microservice decoupling, each backend container maintains its own distinct Prisma repository structure and schema definition:

*   **Auth Service Schema Isolation:**
    *   *Path:* `/auth-service/prisma/schema.prisma`
    *   *Connection Target:* `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres-db:5432/auth_db`
    *   *Entities Managed:* `User`, `OAuthProfile`, `TwoFactorSecret`, `Friendship`, `UserBlock`.

*   **Game Service Schema Isolation:**
    *   *Path:* `/game-service/prisma/schema.prisma`
    *   *Connection Target:* `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres-db:5432/game_db`
    *   *Entities Managed:* `MatchHistory`, `GameStats`, `ChatChannel`, `ChatMessage`, `ChannelMember`.

Each service runs isolated migration sequences during initialization (`npx prisma migrate deploy`), target-bound only to its allocated database schema.

#### 3.3 Data Persistence & Volume Mapping
Data durability across container lifecycle events (rebuilds, restarts, crashes) is managed through Docker named volume mapping:

*   **Volume Definition:** `db-data` mapped to PostgreSQL storage directory `/var/lib/postgresql/data`.
*   **Compose Configuration:**
```yaml
services:
  postgres-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
    volumes:
      - db-data:/var/lib/postgresql/data
      - ./docker/postgres/init-databases.sh:/docker-entrypoint-initdb.d/init-databases.sh
    networks:
      - backend-network

volumes:
  db-data:
    driver: local
```

---

### 4. WEB-SOCKET STREAM UPGRADE & STATE ROUTING FLOW

#### 4.1 Handshake & Protocol Upgrade Routing Sequence
1.  **Client Initiation:** Frontend establishes connection request using `socket.io-client` targeting gateway route `wss://domain.com/socket.io/?EIO=4&transport=websocket`.
2.  **Gateway Auth Interception:**
    *   `api-gateway` intercepts connection request at entry point.
    *   Extracts Bearer Token from HTTP handshake header (`Authorization: Bearer <JWT>`) or cookie context.
    *   Cryptographically validates JWT signature using shared cluster secret `JWT_SECRET`.
    *   Decodes payload (`userId`, `username`). Rejects unauthorized attempts with `401 Unauthorized` HTTP status prior to network upgrade.
3.  **Proxy Handshake Pass-Through:**
    *   Upon successful validation, `api-gateway` proxies WebSocket upgrade headers (`Upgrade: websocket`, `Connection: Upgrade`) over `backend-network` to `game-service:5002`.
4.  **Socket Context Association:**
    *   `game-service` accepts WebSocket connection.
    *   Attaches decoded `userId` context directly to socket instance state (`socket.data.userId = decoded.userId`).

#### 4.2 Real-Time Chat Engine Packet Flow
1.  **Event Dispatch:** Frontend emits `chat:message_send` event payload containing `{ channelId, content }`.
2.  **Access Control Verification:** `game-service` receives frame, reads `socket.data.userId`, and queries `game_db` to verify sender is not blocked by recipient and holds valid permissions in target channel.
3.  **Persistence Layer:** Message data is saved to `ChatMessage` table in `game_db`.
4.  **Broadcast Execution:** `game-service` emits `chat:message_receive` event payload exclusively to socket room matching target channel ID (`io.to(`channel_${channelId}`).emit(...)`).

#### 4.3 Pac-Man 30-FPS Real-Time Game Engine Loop
1.  **Lobby Assignment:** Players emit `game:join_queue`. Matchmaking algorithm pairs two players and allocates dedicated `gameId` room.
2.  **Server State Loop Execution:**
    *   `game-service` runs fixed interval loop at 33.33ms (30 Ticks/Sec) per active match.
    *   Input buffers consume player direction inputs received via `game:input_press` events.
    *   Server computes authoritatively:
        *   Pac-Man position vectors and tile collision models.
        *   Ghost AI movement paths and state transitions (Scatter, Chase, Frightened).
        *   Pellet consumption, score modification, and life count states.
3.  **State Frame Serialization & Broadcast:**
    *   Every tick, server serializes current gameState payload:
        ```json
        {
          "tick": 4820,
          "pacman": { "x": 14.5, "y": 18.0, "dir": "LEFT" },
          "ghosts": [
            { "id": "blinky", "x": 11.0, "y": 13.0, "state": "CHASE" }
          ],
          "score": 1240,
          "lives": 3
        }
        ```
    *   Payload is broadcast to room `game:${gameId}` via WebSocket frame stream.
4.  **Client Render & Interpolation:** Frontend receives raw state vectors, performs linear position interpolation between ticks, and draws updated frame onto standard 2D Canvas context.

---

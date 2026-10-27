# Overview — how PACOVA works

## 1. The containers

Only **one port is public (443)**. Everything else lives on the private Docker network `pacova`.

```mermaid
flowchart LR
    B[Browser] -- HTTPS / WSS :443 --> N[frontend<br/>NGINX + React build]
    N -- "/api/*" --> G[api-gateway :3000]
    N -- "/uploads/*" --> U
    G -- /auth --> A[auth :3001]
    G -- /users /user --> U[user :3004]
    G -- /chat + ws --> C[chat :3003]
    G -- /game + ws --> M[game :3002]
    A --> DA[(auth_db)]
    U --> DU[(user_db)]
    C --> DC[(chat_db)]
    M --> DG[(game_db)]
    M -. match result .-> U
    subgraph PostgreSQL 17
    DA
    DU
    DC
    DG
    end
```

## 2. Life of a request

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as NGINX
    participant G as API Gateway
    participant S as Service
    B->>N: GET /api/chat/friends (Authorization: Bearer JWT)
    N->>G: forward to :3000 (prefix /api removed)
    G->>G: verify JWT, rate limit, add x-user-id
    G->>S: proxy to chat service
    S-->>B: JSON response (same path back)
```

Services never check passwords or tokens themselves for REST: the gateway verifies the JWT and tells them **who** the user is with the `x-user-id` header.

## 3. Login workflow

```mermaid
flowchart TD
    A[User opens the site] --> B{Has refresh cookie?}
    B -- yes --> C[POST /auth/refresh] --> D[New access JWT, user is logged in]
    B -- no --> E[Login page]
    E --> F[Email + password] --> G{2FA enabled?}
    G -- no --> D
    G -- yes --> H[Enter TOTP or recovery code] --> D
    E --> I[Continue with 42] --> J[42 intra] --> K[Callback + one-time ticket] --> D
    D --> L[Frontend opens chat WebSocket, user is online]
```

## 4. WebSocket workflow (chat and game)

```mermaid
sequenceDiagram
    participant B as Browser
    participant G as API Gateway
    participant S as chat / game service
    B->>G: new WebSocket(/api/game/ws?token=JWT)
    G->>G: verify JWT during HTTP upgrade
    alt invalid or missing token
        G-->>B: 401, connection closed
    else valid
        G->>S: upgrade with x-user-id
        S-->>B: connection open
        B->>S: {"event": "...", "data": {...}}
        S-->>B: {"event": "...", "data": {...}}
    end
```

All messages use the same envelope `{event, data}`; event names and payloads are typed once in `shared/types` and imported by frontend and services.

## 5. A full online game, from click to leaderboard

```mermaid
sequenceDiagram
    participant P1 as Player 1
    participant P2 as Player 2
    participant GS as game service
    participant US as user service
    participant DB as game_db
    P1->>GS: queue
    P2->>GS: queue
    GS-->>P1: matchFound {gameId}
    GS-->>P2: matchFound {gameId}
    P1->>GS: joinGame
    P2->>GS: joinGame
    Note over GS: 3 s countdown, then loop at 30 ticks/s
    loop every tick while playing
        P1->>GS: playerInput (direction)
        P2->>GS: playerInput (direction)
        GS-->>P1: gameState
        GS-->>P2: gameState
    end
    GS->>DB: save Match + MatchParticipant
    GS->>US: POST /profile/update-stats (win / loss / draw)
    GS-->>P1: final gameState (winner)
    GS-->>P2: final gameState (winner)
    Note over DB: leaderboard = count of WIN results per user
```

## 6. Where to read next

Each box above has its own page — see the [index](../README.md).
# WebSocket Protocol — PACOVA

## What WS is
A normal HTTP request is one-shot: ask, answer, close. WebSocket (WS) opens
**one connection that stays open**, so client and server can send messages
to each other anytime, in either direction, without re-asking each time.
Used here for real-time game state and chat.

## How a connection is established
1. Browser calls `new WebSocket("wss://.../api/game/ws?token=<JWT>")`
2. Request hits **nginx** → `/api/` location strips the prefix, forwards to **api-gateway**
3. **api-gateway** (`server.on('upgrade')`) reads `?token=`, verifies the JWT
   - invalid/missing → `401`, connection rejected
   - valid → proxies the upgrade to the target service (`game` or `chat`)
4. Service accepts it (`wss.on('connection')`) — connection is now open

## Message format (the contract)
Every message sent either direction is JSON with two fields:
```json
{ "event": "playerInput", "data": { "gameId": "abc", "direction": "up" } }
```
- `event` — which action this is (see event list below)
- `data` — the payload for that event

This shape + all event names/payloads are defined once in
`shared/types/game-types.ts` (and `chat-types.ts` for chat), imported by
both frontend and the relevant service — so both sides always agree on
the format.

## Events (game channel)
| Event | Direction | Purpose |
|---|---|---|
| `joinGame` | client → server | Join a match (adds this socket to a room) |
| `playerInput` | client → server | Player moved (direction) |
| `gameState` | server → client | Current state of the match (positions, score, tick) |
| `gameStart` / `gameOver` | server → client | Match lifecycle (not implemented yet) |

## Broadcasting
Some updates need to reach **every player in the same match**, not just
the sender — e.g. when Player A moves, Player B also needs to see it.

- The server keeps a registry: `gameId → Set of connected sockets` (a room)
- `joinGame` adds a socket to its room
- On `playerInput`, the server recalculates state and sends it to
  **every socket in that room** (not just the sender)
- On disconnect, the socket is removed from its room; empty rooms are deleted

This is not the Tournament/matchmaking module (out of scope for this
project) — it's the minimum grouping needed for any real-time 1v1 match,
so state updates reach both players, not just the one who acted.

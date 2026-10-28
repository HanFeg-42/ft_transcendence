# Chat service (`chat`, port 3003, `chat_db`)

**Responsibility:** everything social and real-time — messages, online presence, blocking, friends, notifications. Owners: `machaouk` (chat), `oelmanso` (friends), `hfegrach` (notifications).

## Two channels

| Channel | Used for |
|---|---|
| **REST** (`/api/chat/...`) | History and actions: `GET /messages/:friendId`, `/friends`, `/friends/requests`, `/blocks/:id`, `/notifications`, `/users/search` |
| **WebSocket** (`/api/chat/ws?token=`) | Live: messages, typing, read receipts, presence, game invites, notifications |

## WebSocket events (typed in `shared/types/chat-types.ts`)

| Event | Direction | Meaning |
|---|---|---|
| `message` | both | A text message |
| `typing` | both | "X is typing…" |
| `read` | both | Messages from X were read (read receipt) |
| `presence` | server → client | A friend went online / offline |
| `gameInvite` | both | Invite a friend to a game |
| `gameInviteReply` | both | Accept or decline an invite |
| `notification` | server → client | New notification |
| `error` | server → client | Something was refused |

Safety: a socket is limited to **20 messages/invites per 10 s**; messages between users who blocked each other are refused.

## Sending a message

```mermaid
sequenceDiagram
    participant A as Alice (browser)
    participant C as chat service
    participant DB as chat_db
    participant B as Bob (browser)
    A->>C: message {receiver_id, content}
    C->>C: rate limit + is either user blocking the other?
    C->>DB: save Message
    C-->>A: message (echo with id)
    C-->>B: message (if Bob is online)
    C->>DB: create Notification, push it to Bob
    B->>C: read {sender_id}
    C-->>A: read {reader_id, read_at}
```

## Game invite from chat

```mermaid
sequenceDiagram
    participant A as Alice
    participant C as chat service
    participant B as Bob
    A->>C: gameInvite {receiver_id}
    C->>C: save Message(kind=game_invite, meta={gameId, status:pending})
    C-->>B: gameInvite
    alt Bob accepts within 60 s
        B->>C: gameInviteReply {accept:true}
        C-->>A: status accepted
        Note over A,B: both open the same gameId on the game service
    else declined or 60 s passed
        C-->>A: status declined / expired
    end
```

## Presence

The service keeps a map `userId → set of sockets` (so several tabs work). When the first socket of a user opens, friends and message partners get `presence: online`; when the last one closes, `presence: offline`.

## Friends

```mermaid
stateDiagram-v2
    [*] --> pending: POST /friends/requests
    pending --> friends: accept (Friendship row created)
    pending --> declined: decline
    pending --> cancelled: sender cancels (DELETE)
    friends --> [*]: DELETE /friends/:userId
```

`Friendship` stores the two ids in sorted order (`userLowId`, `userHighId`) with a unique constraint, so the same friendship can never exist twice.

## Notifications

`notifyUser()` first **stores** the notification, then **pushes** it on the socket if the user is online. Types: `message`, `friend_request`, `friend_accepted`. The UI shows an unread counter and a Notifications page (mark one / all as read).
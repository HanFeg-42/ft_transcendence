# Database

One **PostgreSQL 17** server, **four databases** (created by `postgres-db/init.sql`). Each service owns one and accesses it with **Prisma**. Services refer to users only by `userId`, never with a cross-database foreign key, so they stay independent.

```mermaid
flowchart LR
    auth --- auth_db[(auth_db)]
    user --- user_db[(user_db)]
    chat --- chat_db[(chat_db)]
    game --- game_db[(game_db)]
```

## auth_db — accounts

```mermaid
erDiagram
    User ||--o{ TwoFactorRecoveryCode : has
    User {
        int id PK
        string username UK
        string email UK
        string passwordHash "null for 42 users"
        int fortyTwoId UK "null for password users"
        string avatar
        boolean twoFactorEnabled
        string twoFactorSecret
        datetime createdAt
    }
    TwoFactorRecoveryCode {
        bigint id PK
        int userId FK
        string codeHash
        datetime usedAt
        datetime createdAt
    }
```

## user_db — profiles and achievements

```mermaid
erDiagram
    Profile ||--o{ UserAchievement : earns
    Achievement ||--o{ UserAchievement : "is earned in"
    Profile {
        int userId PK
        string displayName
        string bio
        string avatarUrl
        string statusText
        datetime createdAt
        datetime updatedAt
    }
    Achievement {
        string id PK
        string title
        string description
        string image
        string borderColor
        string textColor
    }
    UserAchievement {
        int userId PK,FK
        string achievementId PK,FK
        boolean unlocked
        int progress
        datetime unlockedAt
    }
```

## chat_db — messages, friends, notifications

```mermaid
erDiagram
    Message {
        int id PK
        int senderId
        int receiverId
        string content
        string kind "text or game_invite"
        json meta "gameId, status"
        datetime readAt
        datetime createdAt
    }
    BlockedUser {
        int id PK
        int blockerId
        int blockedId "unique with blockerId"
    }
    FriendRequest {
        bigint id PK
        int requesterId
        int addresseeId "unique with requesterId"
        string status
        datetime respondedAt
    }
    Friendship {
        bigint id PK
        int userLowId
        int userHighId "unique with userLowId"
    }
    Notification {
        bigint id PK
        int userId
        string type
        json payload
        boolean isRead
        datetime createdAt
    }
```

These tables are independent (they point to users by id, not to each other), so there are no relation lines. Indexes: messages by (`senderId`, `receiverId`, `createdAt`), notifications by (`userId`, `isRead`, `createdAt`).

## game_db — matches

```mermaid
erDiagram
    Match ||--o{ MatchParticipant : has
    Match {
        bigint id PK
        string mode "1v1"
        string status
        string mazeSeed
        int timeLimitSeconds "360"
        int winnerUserId
        datetime startedAt
        datetime endedAt
    }
    MatchParticipant {
        bigint id PK
        bigint matchId FK
        int userId
        int slot "unique with matchId"
        string result "WIN, LOSS, DRAW"
        int score
        int pelletsEaten
        int ghostsEaten
        int livesRemaining
    }
```

`(matchId, userId)` is also unique: a player cannot appear twice in one match. Statistics and the leaderboard are computed from `MatchParticipant`.

## Migrations

Each service has its own `prisma/migrations`. They are applied automatically at container start (`prisma migrate deploy`) or manually with `make migrate`.
# Auth service (`auth`, port 3001, `auth_db`)

**Responsibility:** who you are — accounts, passwords, sessions, 42 login, 2FA. Owner: `hfegrach`.

## Endpoints

| Method | Path (via gateway `/api/auth/...`) | Purpose |
|---|---|---|
| POST | `/register` | Create an account |
| POST | `/login` | Email + password login |
| POST | `/refresh` | Get a new access token from the refresh cookie |
| POST | `/logout` | Clear the refresh cookie |
| GET | `/me` | Current user (needs JWT) |
| GET | `/42/login`, `/42/callback`, POST `/42/exchange` | 42 OAuth flow |
| POST | `/2fa/setup`, `/2fa/confirm`, `/2fa/disable` | Manage 2FA (needs JWT) |
| POST | `/2fa/verify-login` | Finish a login that requires 2FA |

## Sessions

- **Access token:** short-lived JWT (15 min), kept **in memory** by the frontend (not in localStorage), renewed silently before it expires.
- **Refresh token:** `httpOnly` cookie, so JavaScript cannot read it. On page reload the frontend calls `/refresh` to log back in.
- Passwords are **salted and hashed with bcrypt**; the plain password is never stored.
- Inputs are validated in the frontend (`utils/validation.ts`: username 3–20 chars, valid email, password 8–72 chars with a letter and a digit) and again in the backend.

## Login with 2FA

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as auth
    B->>A: POST /login (email, password)
    A->>A: bcrypt compare
    alt 2FA disabled
        A-->>B: access token + refresh cookie
    else 2FA enabled
        A-->>B: challengeToken (no session yet)
        B->>A: POST /2fa/verify-login (challengeToken + TOTP or recovery code)
        A-->>B: access token + refresh cookie
    end
```

## Enabling 2FA

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as auth
    B->>A: POST /2fa/setup
    A-->>B: secret as QR code
    Note over B: user scans it in an authenticator app
    B->>A: POST /2fa/confirm (6-digit code)
    A-->>B: 2FA enabled + recovery codes (stored hashed)
```

## Login with 42

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as auth
    participant I as 42 intra
    B->>A: GET /42/login
    A-->>B: redirect to 42 (with random state cookie)
    B->>I: user authorizes the app
    I-->>B: redirect to /42/callback?code&state
    B->>A: callback
    A->>A: check state matches the cookie
    A->>I: exchange code for token, GET /v2/me
    A->>A: find user by fortyTwoId, or create one
    A-->>B: redirect to frontend with a one-time ticket
    B->>A: POST /42/exchange (ticket)
    A-->>B: access token + refresh cookie
```

If the email already belongs to a password account, the login is refused (`oauth_account_exists`); if the 42 login name is taken, a random suffix is added.
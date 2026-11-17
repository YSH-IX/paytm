# Paytm API

A TypeScript/Express wallet API using Bun, PostgreSQL, and Prisma. API routes are prefixed with `/api/v1`.

## Requirements and setup

- [Bun](https://bun.com) (project initialized with Bun 1.4.4)
- PostgreSQL 15 or newer

1. Clone the repository and enter its directory.
2. Install dependencies: `bun install`
3. Create a PostgreSQL database, then copy `.env.example` to `.env` and set:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
   PORT=3001
   JWT_SECRET="a-long-random-secret"
   SALT_ROUNDS=10
   ```

4. Generate the Prisma client and apply migrations: `bunx prisma generate` then `bunx prisma migrate deploy`.
5. Start the development server with reload: `bun run dev`. For a regular start, use `bun run start`.

The API is available at `http://localhost:3001/api/v1` (or the port set in `.env`). Run `bun run typecheck` to type-check the project.

## Endpoints

Protected endpoints require a valid `access_token` HTTP-only cookie from login. Refresh and logout use the `refresh_token` cookie instead; they do not require the access token.

| Method | Endpoint | Protected? |
| --- | --- | --- |
| POST | `/auth/signup` | No |
| POST | `/auth/login` | No |
| POST | `/user/refresh` | No (refresh cookie required) |
| POST | `/user/logout` | No (refresh cookie used to revoke session) |
| GET | `/user/all` | No |
| GET | `/user/me` | Yes |
| PUT | `/user/update/password` | Yes |
| PATCH | `/user/update/userData` | Yes |
| POST | `/wallet/create` | Yes |
| GET | `/balance` | Yes |
| POST | `/balance/send` | Yes |
| GET | `/search?q={query}` | Yes |
| GET | `/transactions` | Yes |

Authentication cookies are set by `/auth/login`. The access token expires after one minute; use `/user/refresh` with the refresh cookie to rotate the session and issue fresh cookies. Refresh sessions last seven days.

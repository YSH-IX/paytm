# paytm

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

To type check:

```bash
bun check
```

Run `bun fmt` to format the code.

This project was created using `bun init` in bun v1.4.4. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Authentication

Logging in sets an HTTP-only access cookie and a refresh cookie. The access token
expires after one hour; call `POST /api/v1/auth/refresh` with the refresh cookie
to issue new tokens. Refresh tokens expire after seven days. Logging out clears
both cookies.

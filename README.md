# Note-Taking App

A secure note-sharing application built with Next.js, TypeScript, and PostgreSQL. Users can create notes with time-based or one-time share links, password protection, and full control over sharing lifecycle.

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd note_app
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/note_app"
JWT_SECRET="your-jwt-secret-key"
AUTH_SECRET="your-nextauth-secret"
```

4. Set up the database:
```bash
pnpm prisma generate
pnpm prisma db push
```

5. Start the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend:** Next.js API Route Handlers
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth v5 (Credentials provider) + JWT
- **UI Components:** shadcn/ui (Radix UI primitives)

## Database Schema

```
User
  - id: cuid()
  - email: string (unique)
  - password: string (bcrypt hashed)
  - createdAt: DateTime
  - updatedAt: DateTime

Note
  - id: cuid()
  - title: string
  - content: string
  - userId: string (FK to User)
  - createdAt: DateTime
  - updatedAt: DateTime
  - indexes: [userId]

Share
  - id: cuid()
  - noteId: string (FK to Note)
  - token: uuid (unique)
  - shareType: enum (ONE_TIME, TIME_BASED)
  - accessType: enum (PUBLIC, PASSWORD)
  - passwordHash: string (nullable)
  - expiresAt: DateTime (nullable)
  - isRevoked: boolean (default: false)
  - isUsed: boolean (default: false)
  - viewCount: int (default: 0)
  - createdAt: DateTime
  - updatedAt: DateTime
  - indexes: [token], [noteId]
```

## Share Link Flow

### Creating a Note with Share

1. User creates a note with optional sharing configuration:
   - **Share Type:**
     - `NONE` - Private note only
     - `ONE_TIME` - Link expires after first view
     - `TIME_BASED` - Link expires at a specific datetime
   - **Access Type:**
     - `NONE` - No access
     - `PUBLIC` - Anyone with link can view
     - `PASSWORD` - Requires password to view
   - **Expiry** (for TIME_BASED): Valid datetime
   - **Password** (for PASSWORD): Optional, auto-generated if blank

2. Backend creates the note and optionally a `Share` record

3. Share link format: `http://localhost:3000/share/{uuid}`

4. Response includes:
   - `shareLink`: The generated URL
   - `plainPassword`: Auto-generated password if applicable

### Accessing a Shared Note

1. User visits `GET /share/{token}`
2. Backend validates:
   - Token exists
   - Not revoked
   - Not expired
   - For ONE_TIME: not already used
3. If `accessType === PASSWORD`, returns `requiresPassword: true`
4. If public or unlocked, returns note content and increments view count

### Unlocking a Password-Protected Share

1. User submits password to `POST /share/{token}/unlock`
2. Backend validates password against `bcrypt` hash
3. If valid and share still valid, returns note content
4. If invalid, returns 401

## Password/Key Generation Logic

- Generated when `accessType === "PASSWORD"` and password field is empty
- Uses `Math.random().toString(36).slice(-12)` for 12-character alphanumeric passwords
- Frontend also provides a "Generate" button using `crypto.getRandomValues()` for secure password generation
- Password is stored as `bcrypt` hash (10 rounds) in `Share.passwordHash`
- Plain password is only returned once during creation and never stored or logged

## Expiry Logic

- Only applicable for `TIME_BASED` share type
- `expiresAt` is stored as `DateTime` in the database
- Checked on every access attempt: `new Date(share.expiresAt) < new Date()`
- Returns HTTP 410 Gone if expired
- Frontend accepts multiple datetime formats:
  - `YYYY-MM-DDTHH:mm` (standard ISO)
  - `DD-MM-YYYY HH:mm` (local format)

## Invalidate/Revoke Logic

- Owner can revoke a share link via `PATCH /api/notes/{id}/revoke`
- Sets `isRevoked = true` on the share
- Revoked links return HTTP 403 Forbidden
- Revocation is permanent and cannot be undone
- Only the note owner can revoke shares

## View Count Logic

- **Public access:** `viewCount` increments on every successful view
- **Password unlock success:** `viewCount` increments after successful password unlock
- **Wrong password:** No count increase
- **Expired/revoked link:** No count increase
- **One-time link:** `isUsed` is set to `true` and `viewCount` increments

## Race-Condition Handling

### One-Time Link Race Condition

Uses atomic database operations to prevent double access:

```typescript
// GET /share/[token]
if (share.shareType === "ONE_TIME") {
  const updateResult = await prisma.share.updateMany({
    where: { id: share.id, isUsed: false },
    data: {
      isUsed: true,
      viewCount: { increment: 1 },
    },
  });

  if (updateResult.count === 0) {
    return Response.json({ error: "Share link has already been used" }, { status: 403 });
  }
}
```

**How it works:**
- `updateMany` with `where: { id: share.id, isUsed: false }` ensures only one request succeeds
- If two users request simultaneously, only one will find `isUsed: false`
- The other gets `count === 0` and receives 403

### View Count Safety

Uses Prisma's `increment` operator:
```typescript
await prisma.share.update({
  where: { id: share.id },
  data: {
    viewCount: { increment: 1 },
  },
});
```

This translates to `viewCount = viewCount + 1` in SQL, ensuring atomic increments.

## Frequently Asked Questions

### How do you prevent two users from using a one-time link at the same time?

We use an atomic `updateMany` with a conditional where clause:

```typescript
const updateResult = await prisma.share.updateMany({
  where: { id: share.id, isUsed: false },
  data: { isUsed: true, viewCount: { increment: 1 } },
});
```

Only one query can succeed because the `where` clause matches at most one row. The second concurrent request gets `count === 0` and returns 403.

### How do you update view count safely?

We use Prisma's `{ increment: 1 }` operator, which translates to `viewCount = viewCount + 1` in SQL. This is an atomic operation at the database level, so concurrent updates are safe without explicit locking or transactions.

### How would this work if 1 million people opened the link?

The current design would struggle at that scale. For 1M concurrent opens, you would typically add:
- A Redis cache layer to serve repeated reads without hitting the database
- CDN caching for static note content
- Read replicas for the PostgreSQL database
- Asynchronous view-count updates via a message queue instead of writing on every request

### How would you prevent brute-force attempts on password-protected links?

Rate limiting per IP/token is the primary defense:
- Limit to 5-10 attempts per minute per token or IP
- Add exponential backoff after failed attempts
- Consider CAPTCHA or challenge after repeated failures
- Alert or temporarily lock access after sustained brute-force patterns

This is a high-priority missing piece in the current implementation.

## API Endpoints

```
POST   /api/auth/register        - Register a new user
POST   /api/auth/login           - Login user
GET    /api/auth/me              - Get current user
GET    /api/auth/session         - NextAuth session

GET    /api/notes                - List user's notes
POST   /api/notes                - Create note with optional share
GET    /api/notes/{id}           - Get single note
PATCH  /api/notes/{id}           - Update note
DELETE /api/notes/{id}           - Delete note
PATCH  /api/notes/{id}/revoke    - Revoke share link
POST   /api/notes/{id}/share     - Create share link for existing note

GET    /api/share/{token}        - View shared note
POST   /api/share/{token}/unlock - Unlock password-protected share
POST   /api/share/{token}/revoke - Revoke share link
```

## Authentication

- JWT tokens stored in localStorage
- Middleware validates token via `/api/auth/me`
- Authorization header: `Bearer {token}`
- Token expiry: 24 hours

## Frontend Pages

- `/` - Landing page
- `/login` - Login form
- `/register` - Registration form
- `/dashboard` - User's notes list with share management
- `/notes/new` - Create new note
- `/notes/{id}` - View/edit note
- `/notes/{id}/edit` - Edit note
- `/share/{token}` - Public share view

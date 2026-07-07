# 📝 Note-Taking App

> A secure note-sharing application with AI-powered summarization, built with Next.js, TypeScript, PostgreSQL, and Prisma.

**Repository:** https://github.com/GAURAV07C/note_app.git

---

## 📌 Project Overview

The Note-Taking App allows users to create, edit, and share notes securely. It supports time-based and one-time share links, password protection, and AI-generated summaries. The application is built with a focus on security, performance, and clean code architecture.

**Key Capabilities:**
- Create and manage personal notes
- Share notes via secure, expiring links
- Protect shared notes with passwords
- AI-powered summarization of long notes
- Track view counts and revoke access anytime

---

## ✨ Features

### Core Features
- ✅ **User Authentication** — Register, login, and session management with NextAuth
- ✅ **Note CRUD** — Create, read, update, and delete notes
- ✅ **Secure Share Links** — Generate time-based or one-time share links
- ✅ **Password Protection** — Optional password protection for shared notes
- ✅ **Auto-Generated Passwords** — Secure random passwords when not provided
- ✅ **Expiry Management** — Time-based links expire automatically
- ✅ **Revoke Access** — Instantly invalidate active share links
- ✅ **View Count Tracking** — Accurate tracking of successful views
- ✅ **Rate Limiting** — Protection against brute-force attacks

### Bonus Features
- 🤖 **AI Summarization** — Groq AI + LangChain powered automatic note summarization
- 📊 **Summary Regeneration** — Manually regenerate summaries on demand
- 💾 **Persistent Summaries** — Summaries saved to database with notes

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui |
| **Backend** | Next.js API Route Handlers |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Authentication** | NextAuth v5 + JWT |
| **AI/ML** | LangChain + Groq AI (llama-3.3-70b-versatile) |
| **Caching/Rate Limit** | Redis (ioredis) |
| **UI Components** | Radix UI primitives + shadcn/ui |

---

## 🏗 System Architecture

<details>
<summary>View System Architecture</summary>

```mermaid
graph TD
    A[Client Browser] --> B[Next.js Frontend]
    B --> C[API Route Handlers]
    C --> D[Prisma ORM]
    D --> E[PostgreSQL Database]
    C --> F[Redis Cache]
    C --> G[Groq AI API]
    
    subgraph "Frontend"
        B
    end
    
    subgraph "Backend"
        C
        F
    end
    
    subgraph "External Services"
        G
    end
    
    subgraph "Data Layer"
        D
        E
    end
```

</details>

**Architecture Notes:**
- **Serverless-ready:** All API routes are compatible with Vercel/Netlify deployment
- **Type-safe:** End-to-end TypeScript with Prisma-generated types
- **Scalable:** Redis-backed rate limiting and caching layer
- **AI-enhanced:** Optional Groq AI integration for summarization

---

## 📂 Folder Structure

```
note_app/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │   │   ├── login/route.ts           # User login
│   │   │   ├── register/route.ts        # User registration
│   │   │   └── me/route.ts              # Current user info
│   │   ├── notes/
│   │   │   ├── route.ts                 # Notes CRUD
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts             # Single note operations
│   │   │   │   ├── share/route.ts       # Create share link
│   │   │   │   ├── summarize/route.ts   # AI summary generation
│   │   │   │   └── revoke/route.ts      # Revoke share link
│   │   └── share/
│   │       └── [token]/
│   │           ├── route.ts             # View shared note
│   │           ├── unlock/route.ts      # Password unlock
│   │           └── revoke/route.ts      # Revoke share
│   ├── notes/
│   │   ├── new/page.tsx                 # Create note
│   │   ├── [id]/page.tsx                # View note
│   │   └── [id]/edit/page.tsx           # Edit note
│   ├── share/[token]/page.tsx           # Public share view
│   ├── login/page.tsx                   # Login page
│   ├── register/page.tsx                # Register page
│   └── dashboard/page.tsx               # User dashboard
├── lib/
│   ├── auth.ts                          # NextAuth configuration
│   ├── prisma.ts                        # Prisma client singleton
│   ├── schema.ts                        # Zod validation schemas
│   ├── api-auth.ts                      # Auth helper functions
│   ├── redis.ts                         # Redis client
│   ├── repositories/
│   │   ├── base.ts                      # Repository pattern base
│   │   ├── note.ts                      # Note repository
│   │   ├── share.ts                     # Share repository
│   │   ├── user.ts                      # User repository
│   │   └── rate-limit.ts                # Rate limiting utilities
│   └── utils.ts                         # Utility functions
├── components/
│   ├── shared/
│   │   ├── AuthGuard.tsx                # Authentication guard
│   │   └── Navbar.tsx                   # Navigation bar
│   └── ui/                              # shadcn/ui components
├── prisma/
│   ├── schema.prisma                    # Prisma schema
│   └── migrations/                      # Database migrations
├── __tests__/                           # Test files
├── public/                              # Static assets
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- pnpm (recommended) or npm
- Groq API key (for AI summarization)

### Installation Steps

1. **Clone the repository:**
```bash
git clone https://github.com/GAURAV07C/note_app.git
cd note_app
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Set up environment variables:**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/note_app"
JWT_SECRET="your-jwt-secret-key-here"
AUTH_SECRET="your-nextauth-secret-here"
GROQ_API_KEY="your-groq-api-key-here"
UPSTASH_REDIS_URL="your-upstash-redis-url-here"
```

4. **Generate Prisma client:**
```bash
pnpm prisma generate
```

5. **Set up the database:**
```bash
pnpm prisma db push
```

6. **Start the development server:**
```bash
pnpm dev
```

7. **Open the app:**
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT token signing | ✅ |
| `AUTH_SECRET` | NextAuth secret for session encryption | ✅ |
| `GROQ_API_KEY` | Groq API key for AI summarization | 🟡 (optional) |
| `UPSTASH_REDIS_URL` | Redis URL for rate limiting | 🟡 (optional) |

---

## 🗄 Database Schema

### Entity Relationship Diagram

<details>
<summary>View Database Schema</summary>

```mermaid
erDiagram
    User ||--o{ Note : "creates"
    Note ||--o{ Share : "has"
    
    User {
        string id PK "cuid()"
        string email UK "unique"
        string password "bcrypt hashed"
        datetime createdAt
        datetime updatedAt
    }
    
    Note {
        string id PK "cuid()"
        string title
        string content
        string constentSummary "nullable"
        string userId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Share {
        string id PK "cuid()"
        string noteId FK
        string token UK "uuid"
        ShareType shareType "ONE_TIME | TIME_BASED"
        AccessType accessType "PUBLIC | PASSWORD"
        string passwordHash "nullable"
        datetime expiresAt "nullable"
        boolean isRevoked "default: false"
        boolean isUsed "default: false"
        int viewCount "default: 0"
        datetime createdAt
        datetime updatedAt
    }
```

</details>

### Schema Explanation

**User Model:**
- Stores authentication credentials
- Email is unique for login
- Password is bcrypt hashed (10 rounds)
- One-to-many relationship with Note

**Note Model:**
- Core content storage with title and content fields
- `constentSummary` stores AI-generated summary (nullable)
- Foreign key to User
- Indexed by `userId` for fast user-specific queries

**Share Model:**
- Represents a shareable link for a note
- `token` is a unique UUID used in share URLs
- `shareType`: Determines link behavior (ONE_TIME or TIME_BASED)
- `accessType`: Determines access control (PUBLIC or PASSWORD)
- `passwordHash`: Stores bcrypt hash for password-protected shares
- `expiresAt`: Optional expiry timestamp for TIME_BASED shares
- `isRevoked`: Allows owner to invalidate link
- `isUsed`: Tracks if ONE_TIME link has been accessed
- `viewCount`: Atomic counter for successful views

---

## 🔑 Authentication Flow

<details>
<summary>View Authentication Flow</summary>

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Route
    participant D as Database
    
    U->>F: Enter credentials
    F->>A: POST /api/auth/login
    A->>D: Find user by email
    D-->>A: User record
    A->>A: Verify password (bcrypt)
    A->>A: Generate JWT token
    A-->>F: Return token + user info
    F->>F: Store token in localStorage
    
    Note over F,A: Subsequent requests
    F->>A: Request with Bearer token
    A->>A: Verify JWT
    A->>D: Fetch user data
    D-->>A: User data
    A-->>F: Return protected data
```

</details>

**Authentication Details:**
- Uses NextAuth v5 with Credentials provider
- JWT tokens expire after 24 hours
- Tokens stored in browser localStorage
- Rate limiting: 5 login attempts per minute per IP

---

## 🔗 Share Link Lifecycle

<details>
<summary>View Share Link Lifecycle</summary>

```mermaid
stateDiagram-v2
    [*] --> Created: Owner creates share
    Created --> Active: Share link generated
    Active --> Viewed: User accesses link
    Active --> Expired: Time limit reached
    Active --> Revoked: Owner revokes
    Viewed --> Used: ONE_TIME link consumed
    Used --> [*]
    Expired --> [*]
    Revoked --> [*]
    
    note right of Active
        Public: No password needed
        Password: Requires correct password
    end note
    
    note right of Viewed
        viewCount increments
        ONE_TIME: isUsed = true
        TIME_BASED: viewCount += 1
    end note
```

</details>

**Lifecycle Stages:**

1. **Created:** Owner configures share settings and generates link
2. **Active:** Link is valid and accessible
3. **Viewed:** Successful access increments view count
4. **Used:** ONE_TIME links become unusable after first view
5. **Expired:** TIME_BASED links become invalid after expiry
6. **Revoked:** Owner can invalidate link at any time

---

## 🔒 Password Generation & Storage Logic

### Generation
- **Manual:** User can provide custom password
- **Auto-generated:** 12-character alphanumeric string using `crypto.getRandomValues()` (frontend) or `Math.random().toString(36)` (backend)
- **Format:** Alphanumeric, 12 characters, cryptographically random

### Storage
- Passwords are **never stored in plaintext**
- Stored as **bcrypt hash** with 10 rounds
- Hash stored in `Share.passwordHash` field
- Plain password returned **once** during creation only
- Never logged or stored elsewhere

### Verification
```typescript
const isPasswordValid = await bcrypt.compare(password, share.passwordHash);
```

---

## ⏳ Expiry Logic

### Time-Based Shares
- `expiresAt` is stored as `DateTime` in database
- Checked on every access attempt:
```typescript
if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
  return Response.json({ error: "Share link has expired" }, { status: 410 });
}
```

### Accepted Formats
- **ISO 8601:** `YYYY-MM-DDTHH:mm` (e.g., `2026-12-31T23:59`)
- **Local format:** `DD-MM-YYYY HH:mm` (e.g., `31-12-2026 23:59`)

### Behavior
- Returns HTTP `410 Gone` when expired
- Expired links cannot be accessed or unlocked
- View count does not increment for expired links

---

## 🚫 Revoke / Invalidate Logic

### Revocation Process
- Only the **note owner** can revoke a share link
- Revocation endpoint: `POST /api/share/{token}/revoke`
- Sets `isRevoked = true` on the Share record

### Post-Revocation Behavior
- Returns HTTP `403 Forbidden` for revoked links
- Revocation is **permanent** and cannot be undone
- Owner must create a new share link if needed

### Authorization Check
```typescript
const note = await noteRepo.findById(share.noteId);
if (!note || note.userId !== userId) {
  return Response.json({ error: "Unauthorized" }, { status: 403 });
}
```

---

## 👁 View Count Logic

| Scenario | View Count | Reason |
|----------|-----------|---------|
| Public access | ✅ Increments | Successful view |
| Password unlock success | ✅ Increments | Successful authentication |
| Wrong password | ❌ No change | Failed authentication |
| Expired link | ❌ No change | Link invalid |
| Revoked link | ❌ No change | Link invalid |
| One-time link first view | ✅ Increments + `isUsed = true` | Atomic operation |
| One-time link second view | ❌ No change | Already used |

### Atomic Update
```typescript
await prisma.share.update({
  where: { id: share.id },
  data: { viewCount: { increment: 1 } }
});
```

---

## ⚡ Race Condition Handling

### One-Time Link Race Condition

**Problem:** Two users open a one-time link simultaneously. Both requests read `isUsed: false` before either updates it.

**Solution:** Atomic `updateMany` with conditional where clause:

```typescript
const updateResult = await prisma.share.updateMany({
  where: { id: share.id, isUsed: false },
  data: { isUsed: true, viewCount: { increment: 1 } }
});

if (updateResult.count === 0) {
  return Response.json({ error: "Share link has already been used" }, { status: 403 });
}
```

**How it works:**
- Database executes the update atomically
- Only one request finds `isUsed: false`
- The other request gets `count === 0` and receives 403
- No explicit locks required

### View Count Safety

Uses Prisma's `increment` operator which translates to atomic SQL:
```sql
UPDATE "Share" SET viewCount = viewCount + 1 WHERE id = ?
```

This ensures concurrent increments are safe without explicit locks.

---

## 🛡 Security Decisions

### Authentication & Authorization
- **JWT tokens** stored in localStorage with 24-hour expiry
- **bcrypt** for password hashing (10 rounds)
- **NextAuth** for session management with JWT strategy
- All protected routes verify authentication before access

### Input Validation
- **Zod schemas** validate all incoming request bodies
- Type-safe validation prevents malformed data
- Email normalization (lowercase, trimmed)

### Rate Limiting
- **Login:** 5 attempts per minute per IP
- **Share unlock:** 10 attempts per minute per token+IP
- **Share access:** 30 requests per minute per token+IP
- Uses Redis sliding window algorithm

### Password Security
- Passwords never stored in plaintext
- Auto-generated passwords use cryptographically secure random values
- Passwords only returned once during creation
- bcrypt hashing with 10 rounds

### Share Link Security
- Tokens are UUIDs (hard to guess)
- Links can be revoked instantly
- Expiry prevents indefinite access
- One-time links cannot be reused

---

## 🌍 Scalability (1 Million Users)

### Current Architecture Strengths
- **Stateless API routes** — easy horizontal scaling
- **Prisma connection pooling** — efficient database connections
- **Redis caching** — reduces database load

### Scaling Recommendations

#### 1. Caching Layer
```typescript
// On share access, check Redis first
const cached = await redis.get(`share:${token}`);
if (cached) return JSON.parse(cached);

// If miss, read from DB then cache
const share = await prisma.share.findUnique({ where: { token } });
await redis.setex(`share:${token}`, 60, JSON.stringify(share));
```

#### 2. Asynchronous View Count Updates
```typescript
// Instead of writing on every request
await messageQueue.send({ shareId, action: 'increment' });

// Background worker persists counts
async function processViewCount(message) {
  await prisma.share.update({
    where: { id: message.shareId },
    data: { viewCount: { increment: 1 } }
  });
}
```

#### 3. Database Scaling
- **Read replicas** for PostgreSQL to distribute read load
- **Connection pooling** with PgBouncer
- **Partitioning** Share table by `createdAt` for large datasets

#### 4. CDN & Edge
- Deploy to Vercel/Netlify for global edge network
- Cache public share pages at CDN level
- Use edge middleware for rate limiting

#### 5. Monitoring
- Add APM tools (New Relic, Datadog)
- Track API latency and error rates
- Monitor Redis hit/miss ratios

---

## 🚦 Rate Limiting & Brute Force Protection

### Implementation

Uses Redis sliding window algorithm:

```typescript
const multi = client.multi();
multi.zremrangebyscore(key, 0, windowStart);
multi.zadd(key, now, uniqueMemberId);
multi.zcard(key);
multi.expire(key, window);
const results = await multi.exec();
```

### Current Limits

| Endpoint | Limit | Window | Identifier |
|----------|-------|--------|-----------|
| `POST /api/auth/login` | 5 attempts | 60 seconds | IP address |
| `POST /api/share/{token}/unlock` | 10 attempts | 60 seconds | Token + IP |
| `GET /api/share/{token}` | 30 requests | 60 seconds | Token + IP |

### Response Headers
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1709064000
```

### Error Response
```json
{
  "error": "Too many attempts. Try again in 45 seconds."
}
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register new user | ❌ |
| `POST` | `/api/auth/login` | Login user | ❌ |
| `GET` | `/api/auth/me` | Get current user | ✅ |
| `GET` | `/api/auth/session` | Get NextAuth session | ✅ |

### Notes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/notes` | List user's notes | ✅ |
| `POST` | `/api/notes` | Create note with optional share | ✅ |
| `GET` | `/api/notes/{id}` | Get single note | ✅ |
| `PATCH` | `/api/notes/{id}` | Update note | ✅ |
| `DELETE` | `/api/notes/{id}` | Delete note | ✅ |
| `POST` | `/api/notes/{id}/summarize` | Generate AI summary | ✅ |
| `POST` | `/api/notes/{id}/share` | Create share link | ✅ |
| `POST` | `/api/notes/{id}/revoke` | Revoke share link | ✅ |

### Share

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/share/{token}` | View shared note | ❌ |
| `POST` | `/api/share/{token}/unlock` | Unlock password-protected share | ❌ |
| `POST` | `/api/share/{token}/revoke` | Revoke share link | ✅ |

---

## 🧪 Edge Cases Covered

| Edge Case | Handling |
|-----------|----------|
| Invalid share token | Returns 404 with error message |
| Expired share link | Returns 410 Gone with expiry message |
| Already used one-time link | Returns 403 with "already used" message |
| Revoked share link | Returns 403 Forbidden |
| Wrong password | Returns 401 Unauthorized, no view count increment |
| Concurrent one-time access | Atomic `updateMany` prevents double use |
| Short content summary | Minimum 20 characters required, returns 400 |
| Missing AI API key | Returns 500 with "AI service not configured" |
| Unauthorized note access | Returns 403 Forbidden |
| Note not found | Returns 404 Not Found |
| Rate limit exceeded | Returns 429 with retry-after seconds |

---

## 🧪 Testing

### Test Coverage

The project includes comprehensive API tests covering all major endpoints and edge cases:

**Test Suites:**
1. **Authentication** — Registration, login, session management, rate limiting
2. **Notes API** — CRUD operations, authorization checks
3. **Share API** — Public access, password protection, expiry, revocation, view counts
4. **Rate Limiting** — Login brute-force protection, share unlock rate limits
5. **Race Conditions** — Concurrent one-time link access, parallel unlock attempts
6. **Security** — Unauthorized access prevention, token validation

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Test Scenarios Covered

| Category | Test Cases |
|----------|-----------|
| **Authentication** | Register new user, duplicate email, invalid email, short password, missing fields, login with correct/wrong credentials, non-existent email, rate limiting after 50 failed attempts, rate limit reset on success |
| **Notes CRUD** | Create note, get user notes, get note by ID, update note, delete note, unauthorized access (401/403), non-existent note (404) |
| **Share Public Access** | Access public share without auth, password-protected share requires password, unlock with correct/wrong password, rate limit after 10 wrong attempts, invalid token (404), expired share (410), revoked share (403), one-time share already used (403) |
| **Share Creation** | Create share for existing note, password-protected share, duplicate active share prevention, unauthorized share creation |
| **View Count** | Increment on public access, increment on successful password unlock, no increment on wrong password, no increment on expired/revoked links, multiple accesses accumulate correctly |
| **Race Conditions** | Concurrent access to ONE_TIME public share (only 1 succeeds), concurrent password unlocks for ONE_TIME share (only 1 succeeds) |
| **Revoke** | Revoke without auth (401), intruder revoking owner share (403), owner revoke succeeds (200), access after revoke (403) |

### Example Test Output

```bash
PASS  __tests__/index.test.js
  Authentication
    POST /api/auth/register
      ✓ should register a new user (45ms)
      ✓ should return 409 for duplicate email (12ms)
      ✓ should return 400 for invalid email (8ms)
    POST /api/auth/login
      ✓ should login with correct credentials (52ms)
      ✓ should return 401 for wrong password (15ms)
      ✓ should rate limit after too many failed login attempts (3.2s)
  Notes API
    ✓ should create a note without share settings (28ms)
    ✓ should create a ONE_TIME public share note (35ms)
    ✓ should get user notes (18ms)
  Share API
    ✓ should access public ONE_TIME share (22ms)
    ✓ should fail to access used ONE_TIME share (19ms)
    ✓ should require password for PASSWORD accessType share (15ms)
    ✓ should handle concurrent access to ONE_TIME share correctly (45ms)
    ✓ should increment view count for public TIME_BASED share (67ms)

Test Suites: 1 passed, 1 total
Tests:       45 passed, 45 total
```

### Test Credentials

For manual UI/API testing, you can use these pre-seeded test credentials:

```
Email: test@example.com
Password: Test@123Test
```

> **Note:** If the account does not exist yet, run the seed script first:
> ```bash
> pnpm tsx scripts/seed-test-user.ts
> ```

Or register a new account via the `/register` page.

---

## 🤖 AI Summarization (Bonus Feature)

### How It Works

<details>
<summary>View AI Summarization Flow</summary>

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Route
    participant G as Groq AI
    participant D as Database
    
    U->>F: Click "Summarize" button
    F->>A: POST /api/notes/{id}/summarize
    A->>A: Validate content length (20+ chars)
    A->>G: Send note content to Groq AI
    G->>G: Generate summary with Llama 3.3
    G-->>A: Return summary text
    A->>D: Save to constentSummary field
    A-->>F: Return summary
    F->>F: Display summary to user
```

</details>

### Implementation Details

**Model:** Groq llama-3.3-70b-versatile  
**Temperature:** 0 (deterministic output)  
**Prompt:** System prompt instructs concise summarization

**Frontend Validation:**
- Button disabled when content < 20 characters
- Prevents unnecessary API calls

**Backend Validation:**
- Rejects content shorter than 20 characters
- Returns 400 with error message

**Storage:**
- Summary saved to `Note.constentSummary` field
- Persisted with note in PostgreSQL
- Loaded automatically on note view/edit

**Regeneration:**
- Users can regenerate summary by clicking button again
- Overwrites previous summary in database

---

## 🚀 Deployment

### Vercel Deployment

1. **Push code to GitHub**
2. **Import project in Vercel**
3. **Add environment variables:**
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `AUTH_SECRET`
   - `GROQ_API_KEY` (optional)
   - `UPSTASH_REDIS_URL` (optional)
4. **Deploy**

### Build Process

```json
{
  "scripts": {
    "prebuild": "prisma generate",
    "build": "next build"
  }
}
```

The `prebuild` script ensures Prisma client is generated before Next.js build.

### Database Migration

For production deployments:
```bash
pnpm prisma migrate deploy
```

---

## 🎥 Demo Checklist

Record a demo video showing:

- [ ] **Note Creation** — Create a new note with title and content
- [ ] **Share Link Generation** — Configure share type and access type
- [ ] **Public Share Flow** — Open public link in incognito window
- [ ] **Password-Protected Flow** — Open password link and enter password
- [ ] **Dynamic Password Generation** — Show auto-generated password
- [ ] **Wrong Password Case** — Enter incorrect password, show error
- [ ] **One-Time Expiry** — Open one-time link twice, second time fails
- [ ] **Time-Based Expiry** — Set short expiry, show link expiration
- [ ] **Force Invalidate** — Revoke active share link from dashboard
- [ ] **View Count Update** — Show view count incrementing
- [ ] **AI Summarization** — Create long note, click summarize, show result

---

## 🔮 Future Improvements

- [ ] **Email Notifications** — Send email when note is shared
- [ ] **Note Versioning** — Track changes over time
- [ ] **Rich Text Editor** — Support formatting in notes
- [ ] **Tags & Categories** — Organize notes better
- [ ] **Search & Filters** — Find notes quickly
- [ ] **Bulk Operations** — Delete/export multiple notes
- [ ] **Analytics Dashboard** — Detailed share analytics
- [ ] **Webhook Support** — Notify external systems on share events
- [ ] **Mobile App** — React Native mobile client
- [ ] **Offline Mode** — PWA support for offline note creation

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## ❓ Frequently Asked Questions

### Setup Instructions

1. Clone the repository
2. Run `pnpm install`
3. Copy `.env.example` to `.env` and fill in values
4. Run `pnpm prisma generate && pnpm prisma db push`
5. Run `pnpm dev`
6. Open http://localhost:3000

### Tech Stack Used

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend:** Next.js API Route Handlers
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth v5 + JWT
- **AI:** LangChain + Groq AI
- **Caching:** Redis (ioredis)

### Database Schema

- **User:** id, email, password, timestamps
- **Note:** id, title, content, constentSummary, userId, timestamps
- **Share:** id, noteId, token, shareType, accessType, passwordHash, expiresAt, isRevoked, isUsed, viewCount, timestamps

### Share Link Flow

1. Owner creates note with share settings
2. System generates unique token and creates Share record
3. Share link format: `/share/{uuid}`
4. Recipient accesses link, system validates token
5. If password-protected, recipient enters password
6. System increments view count and returns note content
7. One-time links are marked as used after first access

### Password/Key Generation Logic

- Generated when `accessType === "PASSWORD"` and password field is empty
- Uses `Math.random().toString(36).slice(-12)` for 12-character alphanumeric passwords
- Frontend also provides a "Generate" button using `crypto.getRandomValues()`
- Password is stored as `bcrypt` hash (10 rounds)
- Plain password returned only once during creation

### Expiry Logic

- Only applicable for `TIME_BASED` share type
- `expiresAt` stored as `DateTime` in database
- Checked on every access: `new Date(share.expiresAt) < new Date()`
- Returns HTTP 410 Gone if expired
- Frontend accepts: `YYYY-MM-DDTHH:mm` and `DD-MM-YYYY HH:mm`

### Invalidate/Revoke Logic

- Owner calls `POST /api/share/{token}/revoke`
- Sets `isRevoked = true` on the Share record
- Revoked links return HTTP 403 Forbidden
- Revocation is permanent and cannot be undone
- Only note owner can revoke shares

### View Count Logic

- **Public access:** `viewCount` increments on every successful view
- **Password unlock success:** `viewCount` increments after successful unlock
- **Wrong password:** No count increase
- **Expired/revoked link:** No count increase
- **One-time link:** `isUsed` set to `true` and `viewCount` increments atomically

### Race-Condition Handling

**One-time link race condition:**
Uses atomic `updateMany` with conditional where clause:
```typescript
const updateResult = await prisma.share.updateMany({
  where: { id: share.id, isUsed: false },
  data: { isUsed: true, viewCount: { increment: 1 } }
});
```
Only one request succeeds; others get 403.

**View count safety:**
Uses Prisma's `{ increment: 1 }` which translates to atomic SQL.

### How do you prevent two users from using a one-time link at the same time?

We use an atomic `updateMany` with a conditional where clause so only one request can succeed:
```typescript
const updateResult = await prisma.share.updateMany({
  where: { id: share.id, isUsed: false },
  data: { isUsed: true, viewCount: { increment: 1 } }
});
```
The second concurrent request finds no matching row and receives 403.

### How do you update view count safely?

We use Prisma's `{ increment: 1 }`, which becomes `viewCount = viewCount + 1` in SQL. This is atomic at the database level, so concurrent increments are safe without explicit locks.

### How would this work if 1 million people opened the link?

At that scale, you should layer caching and read scaling:
- Put a **Redis** cache in front of share reads
- Use a **message queue** to persist view counts asynchronously
- Add **read replicas** for PostgreSQL
- Use a **CDN** for static/public responses
- Keep the atomic one-time upgrade path for correctness

### How would you prevent brute-force attempts on password-protected links?

Use **rate limiting** backed by **Redis**:
- **Share unlock:** limit attempts per token + IP, e.g. 10/min
- **Login:** limit attempts per IP, e.g. 5/min
- On excess attempts, return 429 with retry window
- Add exponential backoff and consider CAPTCHA after repeated failures

This project includes rate-limiting utilities and applies IP-based limits to login and share unlock endpoints.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, TypeScript, and PostgreSQL**

# Capelli CS Workflow Coach

Internal web application for the Capelli Sports Customer Service team. A RAG-powered AI assistant that guides CS agents step-by-step through every ticket using uploaded training materials as the source of truth.

---

## Prerequisites

- **Node.js** 18.x or later
- **PostgreSQL** 15+ with the **pgvector** extension
- **OpenAI API key** (GPT-4o access required)

---

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repo-url>
cd capelli-cs-coach
npm install
```

### 2. Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/capelli_cs_coach"
NEXTAUTH_SECRET="your-secret-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="52428800"
```

### 3. Database Setup

**Enable pgvector in PostgreSQL:**

```sql
-- Run as superuser
CREATE EXTENSION IF NOT EXISTS vector;
```

**Create the database:**

```sql
CREATE DATABASE capelli_cs_coach;
```

**Push the schema:**

```bash
npm run db:push
```

**Seed with demo users and all 30 workflows:**

```bash
npm run db:seed
```

### 4. Create uploads directory

```bash
mkdir uploads
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts (after seeding)

| Role         | Email                          | Password      |
|--------------|-------------------------------|---------------|
| Admin        | admin@capellisports.com        | Admin123!     |
| Team Leader  | teamlead@capellisports.com     | Leader123!    |
| Trainer      | trainer@capellisports.com      | Trainer123!   |
| Agent        | agent@capellisports.com        | Agent123!     |
| QA           | qa@capellisports.com           | QA1234567!    |

> **Change all passwords immediately in a real deployment.**

---

## First Steps After Setup

1. **Log in as Admin**
2. Go to **Admin › Upload Docs**
3. Upload Capelli training materials (PDF, DOCX, XLSX, CSV, TXT)
4. The system will chunk and embed each document automatically
5. Once documents are uploaded, go to **Ticket Coach** and analyze a ticket

Without uploaded documents, the AI still works but will flag all answers as unverified and recommend escalation.

---

## Application Structure

```
src/
├── app/
│   ├── (auth)/login/          — Login page
│   ├── (dashboard)/
│   │   ├── dashboard/         — Home dashboard
│   │   ├── ticket-coach/      — Main ticket analysis tool
│   │   ├── workflows/         — Workflow library (all 30)
│   │   ├── knowledge-base/    — Semantic search
│   │   ├── training/          — Training scenarios
│   │   ├── admin/
│   │   │   ├── page.tsx       — Admin overview
│   │   │   ├── upload/        — Document upload & processing
│   │   │   ├── users/         — User management
│   │   │   └── analytics/     — Team analytics
│   └── api/
│       ├── ticket-coach/analyze/   — POST: analyze ticket
│       ├── ticket-coach/session/   — PATCH/GET: update session
│       ├── feedback/               — POST: session feedback
│       ├── documents/              — GET/DELETE: list/delete docs
│       ├── documents/upload/       — POST: upload file
│       ├── documents/process/      — POST: embed document
│       ├── workflows/              — GET/POST: workflow CRUD
│       ├── workflows/[id]/         — GET/PATCH/DELETE
│       ├── knowledge-base/search/  — GET: semantic search
│       ├── users/                  — GET/POST: user management
│       ├── users/[id]/             — PATCH/DELETE
│       ├── analytics/              — GET: metrics
│       ├── training/scenarios/     — GET: training scenarios
│       └── admin/updates/          — GET/POST: announcements
├── components/
│   ├── ticket-coach/          — All 9-step coach components
│   ├── dashboard/             — Dashboard home
│   ├── workflows/             — Workflow library
│   ├── knowledge-base/        — KB search
│   ├── training/              — Training mode
│   ├── admin/                 — Admin components
│   ├── layout/                — Sidebar, Header
│   └── ui/                    — Button, Card, Badge, etc.
├── lib/
│   ├── ai/                    — OpenAI client, embeddings, prompts, ticket analyzer, doc processor
│   ├── auth/                  — NextAuth config + role utils
│   ├── db/                    — Prisma singleton
│   ├── utils/                 — cn(), helpers, PII redaction
│   └── workflows/             — 30 default workflow definitions
└── types/                     — TypeScript types
```

---

## Key Features

- **9-Step Ticket Coach**: Issue Detection → Missing Info → System Checks → Workflow Steps → Email Draft → Internal Note → Zendesk Assist → Pre-Send Checklist → Completion
- **RAG-Powered**: All guidance sourced from uploaded training documents via pgvector semantic search
- **Pre-Send Gate**: Email copy button locked until all required checklist items are confirmed
- **PII Redaction**: Customer emails, phones, order numbers redacted before sending to OpenAI
- **Audit Logging**: Every login, email copy, password view, and admin change is logged
- **Role-Based Access**: Admin, Team Leader, Trainer, Agent, QA with appropriate permissions
- **30 Built-In Workflows**: All Capelli CS workflows pre-loaded and ready to use

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run db:generate  # Regenerate Prisma client
npm run db:push      # Push schema to DB (no migration history)
npm run db:migrate   # Create migration
npm run db:seed      # Seed demo data + all 30 workflows
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset and re-migrate (DESTRUCTIVE)
```

---

## Security Notes

- All club passwords and sensitive contacts are flagged `isSensitive: true` and hidden from AGENT role
- Internal notes are never included in customer emails
- Direct employee contacts are never shared with customers
- PII is stripped from all AI requests
- Full audit trail for security-sensitive actions

---

## Production Checklist

- [ ] Change all seed passwords
- [ ] Set `NEXTAUTH_SECRET` to a strong random string (32+ chars)
- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Ensure `uploads/` directory is NOT publicly accessible
- [ ] Configure PostgreSQL with proper user permissions (not superuser)
- [ ] Set up regular database backups
- [ ] Enable HTTPS
- [ ] Consider rate-limiting the `/api/ticket-coach/analyze` endpoint

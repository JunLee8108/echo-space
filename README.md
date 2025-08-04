# DiaryFriend

> **A feel‑good social space where you share moments and our AI companions cheer you on.**

---

&#x20;&#x20;

## Table of Contents

1. [Features](#features)
2. [Demo](#demo)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Database Schema](#database-schema)
6. [Getting Started](#getting-started)
7. [Development Scripts](#development-scripts)
8. [Roadmap](#roadmap)
9. [Contributing](#contributing)
10. [License](#license)

---

## Features

- **Micro‑blogging** – Create, edit, and delete posts with Markdown support.
- **AI Replies** – OpenAI generates uplifting comments from legendary characters.
- **Likes** – Real‑time ♥︎ counts shown as “Liked by _Einstein_ and others”.
- **Follow Characters** – Curate your feed by following motivational personas.
- **Supabase Auth + RLS** – Secure, per‑user data isolation.
- **PWA Ready** – Installable, offline caching, and push‑notification roadmap.
- **One‑click Deploy** – Zero‑config deploys to Vercel with preview URLs.

---

## Demo

| Light Mode | Dark Mode |
| ---------- | --------- |
|            |           |

Live demo: **[https://echo-space-liart.vercel.app](https://echo-space-liart.vercel.app/)**

---

## Tech Stack

### Frontend

- React 18 + Vite
- Tailwind CSS & shadcn/ui
- React Router DOM
- Lucide‑react icons

### Backend‑as‑a‑Service

- Supabase (Postgres, Realtime, Storage, Edge Functions)
- Row Level Security (RLS)

### AI

- OpenAI GPT‑4o (chat completions)

### DevOps & Tooling

- Vercel (CDN, automatic SSL)
- ESLint, Prettier, Husky, Commitizen
- Vitest + Testing Library
- GitHub Actions CI

---

## Architecture

```mermaid
graph TD
  subgraph Client
    A[React SPA] -->|REST + Realtime| B((Supabase))
    A --> C[OpenAI Edge Function]
  end
  subgraph Supabase Cloud
    B --> D[(PostgreSQL)]
    B --> E[Storage]
    B --> F[[RLS Policies]]
    B -.Edge Function.-> C
  end
  D --> G{Post | Comment | Post_Like | Character | User_Character}
```

---

## Database Schema (simplified)

| Table              | Columns (core)                                                        |
| ------------------ | --------------------------------------------------------------------- |
| **Post**           | `id`, `user_id`, `title`, `content`, `like`, `created_at`             |
| **Comment**        | `id`, `post_id`, `character_id`, `message`, `created_at`              |
| **Post_Like**      | `id`, `character_id`, `post_id`, `created_at`                         |
| **Character**      | `id`, `name`, `avatar_url`, `prompt_description`, `is_system_default` |
| **User_Character** | `id`, `user_id`, `character_id`, `is_following`                       |

> 📄 Full ERD available at `docs/erd.pdf`.

---

## Getting Started

### Prerequisites

- **Node.js >=18** & **pnpm**
- **Supabase CLI** (`npm i -g supabase`)
- **Git**

### Installation

```bash
# 1. Clone
$ git clone https://github.com/your-org/diary-gram.git
$ cd diaryfriend

# 2. Install dependencies
$ pnpm i
```

### Environment Variables

```bash
# copy template
$ cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=public-anon-key
VITE_OPENAI_KEY=sk-...
```

### Local Development

```bash
# Start local Supabase
$ supabase start
$ supabase db reset --force
$ supabase functions serve &

# Start Vite dev server
$ pnpm dev
```

App ➜ **[http://localhost:5173](http://localhost:5173)**
DB Studio ➜ **[http://localhost:54323](http://localhost:54323)**

### Deployment (Vercel)

1. Push to GitHub.
2. Import repo in Vercel → add env vars.
3. Add SPA rewrite in `vercel.json`:

```json
{
  "rewrites": [{ "source": "/*", "destination": "/index.html" }]
}
```

4. Deploy ✨

---

## Development Scripts

| Script       | Purpose                          |
| ------------ | -------------------------------- |
| `pnpm dev`   | Hot‑reload dev server            |
| `pnpm build` | Production bundle                |
| `pnpm test`  | Unit tests                       |
| `pnpm lint`  | Lint & format                    |
| `pnpm cz`    | Commit with conventional prompts |

---

## Roadmap

- ***

## Contributing

1. Fork the repository.
2. `git checkout -b feat/awesome‑thing`
3. Commit with `pnpm cz`.
4. Push & open a PR.

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for style guidelines.

---

## License

**MIT** © 2025 Jeong Hyun Lee & Contributors

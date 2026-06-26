<div align="center">

# Inking

**A LaTeX editor preview, and organize your LaTeX documents with ease.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Hono](https://img.shields.io/badge/Hono-4-E36002?logo=hono&logoColor=white)](https://hono.dev)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel&logoColor=white)](https://vercel.com)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Jest](https://img.shields.io/badge/Jest-30-C21325?logo=jest&logoColor=white)](https://jestjs.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#license)

</div>

---

## About

**Ink** is a self-hosted LaTeX editor that lets you write, compile, and preview documents right in the browser. Built as a Turborepo monorepo with a Next.js frontend and a Hono backend, it provides a clean dashboard to manage documents, templates, and trash, and renders LaTeX source to PDF on the fly.

## Features

- **LaTeX compilation** - render LaTeX source to PDF instantly via a server-side compile proxy.
- **Split-pane editor** - write LaTeX on the left, preview the rendered result on the right.
- **Document management** - create, edit, search, and organize documents with per-user ownership isolation.
- **Archive & trash** - archive documents to keep them out of the way or delete them into the trash.
- **Templates** - get started quickly from a library of document templates.
- **OAuth authentication** - login with Google or GitHub (JWT access + rotating refresh tokens in httpOnly cookies).
- **Typed API contracts** - Zod schema validation on every request and response.

## Tech Stack

### Monorepo

| Layer           | Technology                                                |
| --------------- | --------------------------------------------------------- |
| Monorepo Tool   | [Turborepo](https://turbo.build)                          |
| Package Manager | [pnpm](https://pnpm.io) (workspaces)                      |
| Language        | [TypeScript](https://www.typescriptlang.org) (throughout) |

### Frontend (`apps/web`)

| Layer     | Technology                                                                |
| --------- | ------------------------------------------------------------------------- |
| Framework | [Next.js 16](https://nextjs.org) (App Router)                             |
| UI        | [React 19](https://react.dev) · [Tailwind CSS 4](https://tailwindcss.com) |
| Icons     | [react-icons](https://react-icons.github.io/react-icons)                  |

### Backend (`apps/server`)

| Layer          | Technology                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| Framework      | [Hono 4](https://hono.dev) via [@hono/node-server](https://github.com/honojs/node-server)                       |
| Authentication | [arctic](https://arctic.js.org) (Google & GitHub OAuth with PKCE) · [jose](https://github.com/panva/jose) (JWT) |
| Validation     | [Zod](https://zod.dev)                                                                                          |

### Database (`packages/database`)

| Layer | Technology                                                                                   |
| ----- | -------------------------------------------------------------------------------------------- |
| DB    | [PostgreSQL](https://www.postgresql.org)                                                     |
| ORM   | [Prisma 7](https://www.prisma.io) via [@prisma/adapter-pg](https://github.com/prisma/prisma) |

## Getting Started

### Prerequisites

- **Node.js** 18+
- **PostgreSQL**
- **pnpm** 9+

### Installation

```bash
git clone https://github.com/your-username/ink.git
cd ink

pnpm install

cp apps/server/.env.example apps/server/.env
cp packages/database/.env.example packages/database/.env
# Edit the .env files with your configuration

pnpm --filter database generate
pnpm --filter database db:push

pnpm dev
```

Frontend: [http://localhost:3000](http://localhost:3000) · API: [http://localhost:3001](http://localhost:3001)

### Environment Variables

`apps/server/.env`:

```
NODE_ENV
FRONTEND_URL
API_URL
ACCESS_JWT_SECRET
REFRESH_JWT_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
LATEX_ONLINE_URL
```

`packages/database/.env`:

```
DATABASE_URL
DATABASE_POOL_SIZE
```

## Scripts

| Script             | Description                        |
| ------------------ | ---------------------------------- |
| `pnpm dev`         | Start all apps in development mode |
| `pnpm build`       | Build all apps and packages        |
| `pnpm lint`        | Lint all apps and packages         |
| `pnpm format`      | Format code with Prettier          |
| `pnpm check-types` | Type-check all apps and packages   |
| `pnpm test`        | Run server unit tests (Jest)       |

## Deployment

1. Provision a **PostgreSQL** database (Neon, Supabase, Railway, etc.).
2. Configure all environment variables for production.
3. Run `pnpm --filter database db:push`.
4. Build and deploy the frontend (`apps/web`) and backend (`apps/server`) separately.

## Contributing

Contributions are welcome! Please follow the existing code conventions and commit style (conventional commits via commitlint).

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the **MIT** license. See `LICENSE` for more information.

---

<div align="center">

_Built with ❤️ using Next.js, Hono, and Prisma._

</div>

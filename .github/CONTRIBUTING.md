# Contributing to Inking

Thank you for your interest in contributing to Inking! This document provides guidelines and steps for contributing.

## Getting Started

1. Fork the repository ([vikas-x7/Inking](https://github.com/vikas-x7/Inking))
2. Clone your fork (`git clone https://github.com/your-username/Inking.git`)
3. Create a branch (`git checkout -b feat/amazing-feature`)
4. Install dependencies (`pnpm install`)
5. Make your changes
6. Pull request-ready commit (`git commit -m 'feat: add amazing feature'`)
7. Push (`git push origin feat/amazing-feature`)
8. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- pnpm 9+

### Environment Variables

Copy the example env files and fill in your values:

```bash
cp apps/server/.env.example apps/server/.env
cp packages/database/.env.example packages/database/.env
```

### Running Locally

```bash
pnpm install
pnpm --filter database generate
pnpm --filter database db:push
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001

### Running Tests

```bash
pnpm --filter hono test
```

## Code Conventions

- Follow the existing code style
- Use TypeScript throughout
- Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, etc.) — enforced by commitlint
- Keep PRs focused on a single change
- Write clear commit messages
- Frontend: Tailwind CSS only, no CSS modules
- Backend: ESM modules, service-layer pattern, Zod validation

## Pull Request Process

1. Update documentation if needed
2. Ensure no TypeScript errors (`pnpm check-types`)
3. Ensure no lint errors (`pnpm lint`)
4. Run the server tests (`pnpm --filter hono test`)
5. Request a review from a maintainer

## Reporting Issues

Use the [GitHub Issues](https://github.com/vikas-x7/Inking/issues) tracker to report bugs or request features.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
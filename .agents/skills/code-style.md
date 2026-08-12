# Code Style Guidelines

## TypeScript

- Use TypeScript strict mode
- Prefer `interface` for object types, `type` for unions/intersections
- Use named exports for utilities/hooks, default exports for React components
- Prefix hooks with `use`

## React Components

- Use `'use client'` directive for client components
- One component per file
- Component file names are PascalCase (e.g., `TopBar.tsx`, `PdfViewer.tsx`)
- Hooks file names are kebab-case with `use-` prefix (e.g., `use-auth.ts`)
- Props interface defined in the same file as the component
- Use functional components only, no class components

## Module Structure

Every feature module follows this shape:

```
src/modules/<feature>/
├── components/   # PascalCase.tsx components
├── hooks/        # use-*.ts hooks, barrel index.ts
├── api/          # API client (index.ts exporting a *Api object)
└── page/         # Feature page wrapper
```

## Imports

- Use `@/` path alias for src imports
- Group imports: external libs, internal modules, types, styles
- Use barrel exports from `index.ts`

## Error Handling

- Use try/catch for async operations
- Show UI states for user-facing errors (full-screen error pages, inline messages)
- Return error text from the API layer and surface it to the UI

## Theming

- Tailwind CSS only, no CSS modules or inline styles
- Editor dark theme lives in `src/modules/editor/theme` (CodeMirror)
- Reuse existing palette: black, #1E1E1E, #252526, #0052EA

## Git Commits

- Format: `type: description`
- Types: feat, fix, docs, refactor, chore, style, test
- Keep commits atomic and focused
- Commits are validated by commitlint and a husky pre-commit hook that runs server tests
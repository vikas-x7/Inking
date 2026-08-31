# Compiler

Self-hosted LaTeX compilation service extracted from [latex-online](https://github.com/aslushnikov/latex-online).
It receives LaTeX source (as text, URL, git repo, or uploaded project archive) and returns a compiled PDF,
or a structured, machine-readable error together with the raw compiler log on failure.

Compilation runs through the bundled `latexrun` wrapper either:

- in-process (`LATEX_EXECUTOR=none`, default) using the TeX toolchain installed on the host, or
- in a one-shot, hardened Docker container (`LATEX_EXECUTOR=docker`) with no network, dropped
  capabilities, resource limits, and a read-only root filesystem.

## API

- `GET /health` – HTML status page
- `GET /health.json` – health, uptime, and capacity
- `GET /version` – version info
- `GET /compile?text=...` / `GET /compile?url=...` / `GET /compile?git=...` – compile from query params
- `POST /compile` – JSON `{ "latex": ... }` or multipart project archive (`entry`, `command`)
- `POST /data` – multipart project archive

All `/compile` and `/data` endpoints are protected by a shared internal token.

## Run locally

Requires Node.js plus a TeX distribution providing `pdflatex` (and `lualatex`/`xelatex` for the other engines).

```bash
pnpm --filter compiler install

# in-process executor (uses your local TeX toolchain)
NODE_ENV=development COMPILER_INTERNAL_TOKEN=dev-secret pnpm --filter compiler start

# docker executor (requires the latex-online image)
NODE_ENV=development COMPILER_INTERNAL_TOKEN=dev-secret \
  LATEX_EXECUTOR=docker LATEX_EXECUTOR_IMAGE=latex-online:biblatex-fixed \
  pnpm --filter compiler start
```

The service listens on `127.0.0.1:2700` by default (`PORT`).

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `2700` | HTTP port |
| `NODE_ENV` | `development` | `production` refuses to start without `COMPILER_INTERNAL_TOKEN` |
| `COMPILER_INTERNAL_TOKEN` | empty | shared secret for `/compile` and `/data` (required in production) |
| `LATEX_EXECUTOR` | `none` | `none` (in-process) or `docker` (isolated container) |
| `LATEX_EXECUTOR_IMAGE` | `latex-online:biblatex-fixed` | Docker image for the isolated executor |
| `LATEX_COMPILE_TIMEOUT_MS` | `60000` | per-compilation timeout |
| `LATEX_MAX_CONCURRENT_COMPILATIONS` | `4` | concurrency limit |
| `LATEX_MAX_OUTPUT_SIZE` | `100MB` | maximum output PDF size |
| `LATEX_MAX_LOG_SIZE` | `100MB` | maximum log size |
| `LATEX_MAX_UPLOAD_SIZE` | `60MB` | maximum multipart upload size |
| `LATEX_MAX_WORKSPACE_SIZE` | `1GB` | maximum job workspace size |
| `LATEX_MIN_FREE_SPACE` | `1GB` | minimum free results-folder space to admit jobs |
| `LATEX_TMP_FOLDER` | `/tmp/downloads` | download/staging folder |
| `LATEX_RESULTS_FOLDER` | `/tmp/storage` | results/cache folder |

## Tests

```bash
pnpm --filter compiler test
```

Unit tests run without extra tooling. Integration tests that exercise the Docker executor
are skipped when no Docker daemon or image is available; biblatex tests are skipped when
`biber` is not installed. The Docker executor tests use the `latex-online:biblatex-fixed`
image (see `apps/compiler/Dockerfile`).

## Backend integration

Not performed yet. Integration with the main backend will be wired up in a later step.
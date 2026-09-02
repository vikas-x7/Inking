# Render service image for the Inking LaTeX compiler.
#
# This is a self-contained deployment target: the Node.js compiler API and the
# TeX toolchain (pdflatex/xelatex/lualatex + latexmk + biber) all live in this
# one image, and the service runs TeX directly (LATEX_EXECUTOR=native). There
# is intentionally NO docker-in-docker: no docker client, no docker socket, no
# privileged mode - the in-process executor spawns the TeX binaries as ordinary
# child processes.
#
# Render settings:
#   Runtime            : Docker
#   Root Directory     : .
#   Dockerfile Path    : apps/compiler/Dockerfile
#   Start Command      : (leave empty - built into the image)
#   Health Check Path  : /health
#   Instance Type      : any size (compiles run on the service instance)
#
# Required runtime env:
#   COMPILER_INTERNAL_TOKEN  shared secret used to authenticate compiles
#   PORT                     Render injects it; defaults to 10000 here
#   LATEX_EXECUTOR           defaults to native in the image
#
# Build (from the repo root):
#   docker build -f apps/compiler/Dockerfile -t inking-compiler .
#
# Run. Note: apps/compiler/.env is the LOCAL dev config (PORT=2700,
# LATEX_EXECUTOR=docker), so the container run must override it:
#   docker run --rm -p 10000:10000 --env-file apps/compiler/.env \
#     -e PORT=10000 -e LATEX_EXECUTOR=native inking-compiler

FROM node:22-slim

# TeX distribution (engines + document classes + common packages + biber +
# latexmk) plus the tools the service shells out to (bash, python3 for the
# latexrun fallback, git for URL/git compilations, curl for the health check).
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        bash \
        python3 \
        texlive-latex-base \
        texlive-latex-recommended \
        texlive-fonts-recommended \
        texlive-latex-extra \
        texlive-bibtex-extra \
        texlive-xetex \
        biber \
        latexmk \
        lmodern \
        cm-super \
    && rm -rf /var/lib/apt/lists/*

# pnpm (exact version from the repo's packageManager field).
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy the dependency manifests first so installs are cached across builds.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/database/package.json packages/database/package.json
COPY apps/compiler/package.json apps/compiler/package.json

# Scoped, production-only install for the compiler workspace member
# (express/multer/request/compression/winston). --ignore-scripts skips husky.
RUN pnpm install --filter compiler --prod --frozen-lockfile --ignore-scripts

# Application code.
COPY apps/compiler apps/compiler

ENV NODE_ENV=production \
    PORT=10000 \
    LATEX_EXECUTOR=native \
    LATEX_TMP_FOLDER=/tmp/downloads \
    LATEX_RESULTS_FOLDER=/tmp/storage

# Non-root operator: everything this service writes lives under /tmp, and the
# staged project + results folders are created at startup by the app itself.
RUN groupadd --gid 10001 compiler && \
    useradd --uid 10001 --gid compiler --no-create-home --shell /usr/sbin/nologin compiler && \
    chown -R compiler:compiler /app
USER compiler

WORKDIR /app/apps/compiler

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:${PORT:-10000}/health || exit 1

CMD ["node", "app.js"]
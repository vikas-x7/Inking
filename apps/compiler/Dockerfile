# Latex-Online hardened production image
#
# - All TeX tooling and dependencies are installed at image build time;
#   no network access or git clone is needed at runtime.
# - The service runs as an unprivileged user.
# - The image is intended to be run with a read-only root filesystem and
#   dropped capabilities (see docker run flags in docs/deploy.md): all
#   writable state lives under /tmp, which is mounted as tmpfs.
#
# Bibliography support:
#   - biblatex.sty ships in texlive-bibtex-extra (not texlive-latex-extra),
#   - biber (the biblatex backend) is a separate package.

FROM node:22-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        texlive-latex-base \
        texlive-latex-recommended \
        texlive-fonts-recommended \
        texlive-latex-extra \
        texlive-bibtex-extra \
        biber \
        texlive-xetex \
        lmodern \
        cm-super \
        python3 \
        ca-certificates \
        docker.io \
        && rm -rf /var/lib/apt/lists/*

RUN userdel node 2>/dev/null || true; \
    groupdel node 2>/dev/null || true; \
    groupadd --gid 1000 app && \
    useradd --create-home --uid 1000 --gid 1000 --shell /bin/bash app

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=app:app . /app

USER app:app

EXPOSE 2700

ENV NODE_ENV=production

CMD ["node", "app.js"]
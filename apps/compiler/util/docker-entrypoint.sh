#!/bin/bash
set -e

# Start the Latex-Online service. TeX tooling and npm dependencies are already
# installed in the image; nothing is fetched at runtime. `exec` keeps the node
# process as PID 1 so that SIGTERM/SIGINT reach it for graceful shutdown.
exec node /app/app.js
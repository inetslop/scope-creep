# Scope Creep agent machine for Linux: Node 24, git, GitHub CLI, Claude Code, and the system
# libraries Chromium needs for the smoke test. Built and run by setup/docker/agent.sh.
#
# Nothing of the repo is baked in: the agent's folder is mounted at /data (repo, home, models) and
# the runner updates its own code with git, so the image only needs rebuilding when tools change.
FROM node:24-bookworm-slim

ARG UID=1000
ARG GID=1000
ARG PLAYWRIGHT_VERSION=1.64.1

RUN apt-get update \
 && apt-get install -y --no-install-recommends git curl ca-certificates gnupg procps \
 && mkdir -p -m 755 /etc/apt/keyrings \
 && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg -o /etc/apt/keyrings/githubcli-archive-keyring.gpg \
 && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends gh \
 && rm -rf /var/lib/apt/lists/*

# Claude Code. Agents run with DISABLE_AUTOUPDATER=1: `agent.sh update` rebuilds the image to update it.
RUN npm install -g @anthropic-ai/claude-code && npm cache clean --force

# Chromium's system libraries. The browser itself is downloaded into the agent's home (/data/home)
# by `npx playwright install`, so it matches the repo's Playwright version.
RUN npx -y "playwright@${PLAYWRIGHT_VERSION}" install-deps chromium \
 && rm -rf /var/lib/apt/lists/* /root/.npm

# Run as a user with the host user's ids, so files in the mounted folder stay theirs.
RUN userdel -r node 2>/dev/null || true; \
    getent group "${GID}" >/dev/null || groupadd -g "${GID}" agent; \
    useradd -M -u "${UID}" -g "${GID}" -d /data/home -s /bin/bash agent

USER agent
ENV HOME=/data/home \
    PLAYWRIGHT_BROWSERS_PATH=/data/home/.cache/ms-playwright
WORKDIR /data/repo
CMD ["bash", "loop/start-agent.sh"]

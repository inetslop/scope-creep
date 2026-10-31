# The Draft Arena box

The live Draft Arena: one small Debian container at home that serves the game page and the match from one build of one commit, and updates itself from GitHub. Humans only: no agent may read or change `deploy/` (`loop/sandbox.ts`), because what is here runs as root.

## What runs where

| | |
| --- | --- |
| `arena.service` | the game server (`engine/server/main.ts`) as the `arena` user, on 127.0.0.1:8790: the page (`STATIC_DIR=dist`), the WebSocket match and `/status` |
| `arena-update.timer` | every 5 minutes, `/usr/local/sbin/arena-update` (from `update.sh`): build the newest game, switch to it when nobody is playing |
| `tailscaled` | Tailscale in userspace networking; its Funnel puts `https://<box>.<tailnet>.ts.net` on the internet, forwarding to port 8790 (WebSockets included) |
| nftables | the box may reach the internet (GitHub, npm, Tailscale), never the LAN |
| `/srv/arena/` | `repo/` (a clone, no working tree), `releases/<commit>/` (built releases), `current` (the live one), `state/` (`live-tree`, `failed`, `hold`), `npm-cache/` |

GitHub Pages keeps its own build without a server (Play there runs the match in the tab, against bots).

## First-time setup

1. In Proxmox: an unprivileged Debian 12 or 13 container (2 cores, 2 GB RAM, 8 GB disk), **DNS server 1.1.1.1** (the firewall blocks the router's DNS), started at boot.
2. Copy this folder to it and run the setup as root:
   ```
   scp -r deploy/arena root@<box>:/root/
   ssh root@<box> bash /root/arena/setup.sh
   ```
   It installs Node 24, the `arena` user, the firewall, Tailscale and the units, clones the repo and starts the first build (a few minutes: `journalctl -fu arena-update`).
3. `tailscale up` on the box, and open the link it prints to add the box to your tailnet.
4. `tailscale funnel --bg 8790`. The first time, it prints a link to allow Funnel for the tailnet: open it, then run the command again. `tailscale funnel status` shows the address.

## Updates

The timer fetches `main`. When `projects/draft-arena/game` changed, it builds that commit in `releases/<commit>/` as `arena` (`npm ci`, `npm run check`, then the page with `VITE_SERVER_URL=same-origin VITE_BUILD_ID=<commit>`) and waits until no human is playing (bots don't count; at most 12 hours, `MAX_WAIT_HOURS`). Then it points `current` at it, restarts the server and waits for `/status` to report the new build; if it doesn't come up, it goes back to the previous release. A game whose check or build fails is listed in `state/failed` and not built again; the next change to the game is. The last 3 releases are kept.

Pages from the old build reload by themselves on the start screen (the build id is in the content hash); a player who presses Play on one is told to reload.

## Looking at it

```
systemctl status arena arena-update.timer
journalctl -u arena -u arena-update -n 100
curl -s 127.0.0.1:8790/status | jq          # players, bots, tick time, bytes per second, errors, build
ls -lt /srv/arena/releases; readlink /srv/arena/current
```

## By hand

- **Update now:** `systemctl start arena-update` (it still waits for the players to leave).
- **Roll back:** `touch /srv/arena/state/hold` (stops the updates), then `ln -sfn /srv/arena/releases/<commit> /srv/arena/current && systemctl restart arena`. Remove `hold` to resume: the next run deploys the newest game again.
- **Build a failed game again:** remove its line from `/srv/arena/state/failed`.
- **After changing `deploy/arena/`:** copy it over and run `setup.sh` again. The box never runs these scripts from `main` by itself. Re-running restarts the server.

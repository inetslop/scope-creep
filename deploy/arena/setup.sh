#!/usr/bin/env bash
# Sets up the Draft Arena box: a fresh, unprivileged Debian 12/13 LXC (DNS set to a public resolver
# such as 1.1.1.1). Run as root from a checkout of this repo:
#
#   bash deploy/arena/setup.sh
#
# Safe to run again: it applies changes to deploy/arena/ (the units, the update script, the
# firewall) and upgrades Node within v24. What it sets up:
#   - Node 24 in /opt/node, a system user `arena`, /srv/arena/{repo,releases,state,npm-cache}
#   - a firewall: the box reaches the internet, never the LAN
#   - Tailscale (userspace networking: an unprivileged LXC has no /dev/net/tun) for the Funnel
#   - arena.service (the game server) and arena-update.timer (every 5 minutes: build the newest
#     game from GitHub and switch to it when nobody is playing)
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/inetslop/scope-creep.git}"
ROOT=/srv/arena
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

say() { printf '\n== %s\n' "$*"; }
die() { printf 'setup: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "run it as root"
[ -r /etc/os-release ] || die "no /etc/os-release: this is meant for Debian"
# shellcheck source=/dev/null
. /etc/os-release
[ "${ID:-}" = debian ] || die "this is meant for Debian (found ${ID:-unknown})"
CODENAME="${VERSION_CODENAME:?no VERSION_CODENAME in /etc/os-release}"

# The firewall below drops everything to the LAN, the router's DNS too. Check that first, or the
# box loses DNS (and apt, git, Tailscale) the moment the firewall is on.
say "Checking DNS"
private_dns=$(awk '/^[[:space:]]*nameserver/ {print $2}' /etc/resolv.conf |
  grep -E '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\.|f[cd]|fe80)' || true)
if [ -n "$private_dns" ]; then
  die "/etc/resolv.conf uses a DNS server on the LAN ($(echo "$private_dns" | tr '\n' ' ')), which the firewall will block.
In Proxmox: the container -> DNS -> DNS servers: 1.1.1.1, then restart the container and run this again."
fi
if grep -Eq '^[[:space:]]*nameserver[[:space:]]+127\.' /etc/resolv.conf; then
  echo "note: DNS goes through a local resolver; make sure its upstream is not on the LAN."
fi

say "Packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q git curl ca-certificates nftables jq xz-utils

say "Node 24"
shasums=$(curl -fsSL https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt)
tarball=$(echo "$shasums" | awk '$2 ~ /^node-v24\.[0-9.]+-linux-x64\.tar\.xz$/ {print $2}')
[ -n "$tarball" ] || die "could not find the Node 24 linux-x64 tarball in SHASUMS256.txt"
version="${tarball%-linux-x64.tar.xz}"
if [ "$(/opt/node/bin/node --version 2>/dev/null || true)" = "${version#node-}" ]; then
  echo "already $version"
else
  tmp=$(mktemp -d)
  curl -fsSL "https://nodejs.org/dist/latest-v24.x/$tarball" -o "$tmp/$tarball"
  (cd "$tmp" && echo "$shasums" | grep " $tarball\$" | sha256sum -c -)
  rm -rf "/opt/$version-linux-x64"
  tar -xJf "$tmp/$tarball" -C /opt
  ln -sfn "/opt/$version-linux-x64" /opt/node
  rm -rf "$tmp"
  echo "installed $(/opt/node/bin/node --version)"
fi

say "User and folders"
id arena >/dev/null 2>&1 || useradd --system --home-dir "$ROOT" --shell /usr/sbin/nologin arena
install -d -o arena -g arena "$ROOT" "$ROOT/releases" "$ROOT/state" "$ROOT/npm-cache"
if [ ! -d "$ROOT/repo/.git" ]; then
  # No working tree: releases are exported from it with git archive.
  runuser -u arena -- git -C "$ROOT" clone --quiet --no-checkout "$REPO_URL" repo
fi
echo "repo: $(runuser -u arena -- git -C "$ROOT/repo" remote get-url origin)"

say "Firewall: the internet yes, the LAN no"
cat >/etc/nftables.conf <<'EOF'
#!/usr/sbin/nft -f
# The Draft Arena box (deploy/arena/setup.sh). It runs code the agents wrote, so it may reach the
# internet (GitHub, npm, Tailscale) but nothing on the LAN. Replies to connections from the LAN
# (SSH) still go out: they are "established".
flush ruleset

table inet arena {
  chain output {
    type filter hook output priority filter; policy accept;
    oif "lo" accept
    ct state established,related accept
    udp dport 67 accept
    meta l4proto ipv6-icmp accept
    ip daddr { 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, 100.64.0.0/10 } drop
    ip6 daddr { fc00::/7, fe80::/10 } drop
  }
}
EOF
if nft -f /etc/nftables.conf; then
  systemctl enable --quiet nftables
  echo "on"
elif [ "${ARENA_SKIP_FIREWALL:-}" = 1 ]; then
  echo "WARNING: the firewall could not be loaded, going on without it (ARENA_SKIP_FIREWALL=1)."
else
  die "the firewall could not be loaded. On the Proxmox host: modprobe nf_tables, and add nf_tables
to /etc/modules-load.d/nftables.conf so it loads at boot; then run this again. (Or block the LAN
in the Proxmox firewall and run this again with ARENA_SKIP_FIREWALL=1.)"
fi

say "Tailscale"
if ! command -v tailscale >/dev/null; then
  curl -fsSL "https://pkgs.tailscale.com/stable/debian/$CODENAME.noarmor.gpg" -o /usr/share/keyrings/tailscale-archive-keyring.gpg
  curl -fsSL "https://pkgs.tailscale.com/stable/debian/$CODENAME.tailscale-keyring.list" -o /etc/apt/sources.list.d/tailscale.list
  apt-get update -q
  apt-get install -y -q tailscale
fi
if grep -q '^FLAGS=' /etc/default/tailscaled; then
  sed -i 's/^FLAGS=.*/FLAGS="--tun=userspace-networking"/' /etc/default/tailscaled
else
  echo 'FLAGS="--tun=userspace-networking"' >>/etc/default/tailscaled
fi
systemctl enable --quiet tailscaled
systemctl restart tailscaled

say "The game server and its updates"
install -m 0755 "$HERE/update.sh" /usr/local/sbin/arena-update
install -m 0644 "$HERE/arena.service" "$HERE/arena-update.service" "$HERE/arena-update.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --quiet arena.service arena-update.timer
systemctl start arena-update.timer
if [ -e "$ROOT/current" ]; then systemctl restart arena.service; fi
# The first build (a few minutes) starts now; the server starts when it is done.
systemctl start --no-block arena-update.service

say "Done. What is left:"
cat <<EOF
1. Follow the first build:      journalctl -fu arena-update
   Then check the server:        curl -s 127.0.0.1:8790/status
2. Log the box in to Tailscale:  tailscale up
   (open the link it prints and sign in)
3. Put it on the internet:       tailscale funnel --bg 8790
   (the first time it prints a link to allow Funnel for your tailnet; open it, then run it again)
   The game is then at:          https://$(hostname).<your tailnet>.ts.net   (tailscale funnel status)
EOF

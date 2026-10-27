#!/bin/sh
# Entrypoint of the llama container: starts llama-server with as much of the model on the GPU as
# fits in the VRAM that is free right now (the desktop's apps take some, and that changes).
#
# LLAMA_GPU_PLAN, written by setup: "need=<MiB with everything on the GPU>;ffn=<block>:<MiB>,..."
# with each layer's dense feed-forward weights, largest first. Every layer and the whole context
# cache stay on the GPU; just enough of the largest feed-forward weights go to the CPU (-ot). That
# is far cheaper than llama.cpp's --fit, which moves whole layers and drags their cache along.
# Without a plan, or if even all feed-forward weights on the CPU would not fit, --fit decides.
# LLAMA_GPU_MARGIN_MIB: VRAM left free for the desktop and allocation spikes (default 640).
set -eu
margin=${LLAMA_GPU_MARGIN_MIB:-640}
plan=${LLAMA_GPU_PLAN:-}
say() { echo "[llama-start] $*"; }

if [ -n "$plan" ] && free=$(nvidia-smi --query-gpu=memory.free --format=csv,noheader,nounits 2>/dev/null | head -1) && [ -n "$free" ]; then
  need=$(echo "$plan" | sed -n 's/.*need=\([0-9]*\).*/\1/p')
  ffn=$(echo "$plan" | sed -n 's/.*ffn=\([0-9:,]*\).*/\1/p')
  spill=$((need + margin - free))
  if [ "$spill" -le 0 ]; then
    say "${free} MiB free, ${need} MiB needed: the whole model fits on the GPU"
    exec /app/llama-server --fit off -ngl 99 "$@"
  fi
  blocks=$(echo "$ffn" | tr ',' '\n' | awk -F: -v want="$spill" '
    got < want { got += $2; list = list (list == "" ? "" : "|") $1 }
    END { if (got >= want) printf "%s %d", list, got }')
  if [ -n "$blocks" ]; then
    moved=${blocks##* }
    blocks=${blocks% *}
    say "${free} MiB free, ${need} MiB needed: ${moved} MiB of feed-forward weights on the CPU (layers ${blocks}), the rest and the whole context cache on the GPU"
    exec /app/llama-server --fit off -ngl 99 -ot "^blk\.(${blocks})\.ffn_(up|gate|down)\.weight\$=CPU" "$@"
  fi
  say "${free} MiB free, ${need} MiB needed: too little VRAM even with every feed-forward weight on the CPU; using llama.cpp's --fit"
fi
exec /app/llama-server "$@"

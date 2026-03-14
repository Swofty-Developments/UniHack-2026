#!/usr/bin/env bash
set -euo pipefail

SESSION="accessatlas"
ROOT="$(cd "$(dirname "$0")" && pwd)"
MONGO_CONTAINER="accessatlas-mongo"
MONGO_PORT=27017

# --- Cleanup previous run ---
tmux kill-session -t "$SESSION" 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# --- Start MongoDB container ---
if docker inspect "$MONGO_CONTAINER" &>/dev/null; then
  docker start "$MONGO_CONTAINER" &>/dev/null
  echo "Started existing MongoDB container"
else
  docker run -d \
    --name "$MONGO_CONTAINER" \
    -p "$MONGO_PORT:27017" \
    -v accessatlas-mongo-data:/data/db \
    mongo:7 --quiet
  echo "Created new MongoDB container"
fi

echo -n "Waiting for MongoDB"
for i in $(seq 1 30); do
  if docker exec "$MONGO_CONTAINER" mongosh --quiet --eval "db.runCommand({ping:1})" &>/dev/null; then
    echo " ready"
    break
  fi
  echo -n "."
  sleep 0.5
done

# --- tmux session (1-indexed from the start) ---
tmux new-session -d -s "$SESSION" -n backend -c "$ROOT/backend"
tmux set-option -t "$SESSION" base-index 1
tmux set-option -t "$SESSION" pane-base-index 1
tmux move-window -t 1
tmux send-keys -t "$SESSION:backend" "bun --watch src/index.ts" C-m

tmux new-window -t "$SESSION" -n frontend -c "$ROOT/frontend"
tmux send-keys -t "$SESSION:frontend" "ANDROID_HOME=\$HOME/Android/Sdk PATH=\$PATH:\$HOME/Android/Sdk/platform-tools npx expo run:android" C-m

tmux new-window -t "$SESSION" -n mongo -c "$ROOT"
tmux send-keys -t "$SESSION:mongo" "docker logs -f $MONGO_CONTAINER" C-m

# --- Keybinds ---
tmux bind-key -n 1 select-window -t "$SESSION:1"
tmux bind-key -n 2 select-window -t "$SESSION:2"
tmux bind-key -n 3 select-window -t "$SESSION:3"
tmux bind-key -n 5 send-keys -t "$SESSION:1" C-c \; send-keys -t "$SESSION:1" "bun --watch src/index.ts" C-m
tmux bind-key -n 0 kill-session

# --- Status bar ---
tmux set-option -t "$SESSION" status-style "bg=#1e293b,fg=#94a3b8"
tmux set-option -t "$SESSION" status-left "#[fg=#2563eb,bold] AccessAtlas #[fg=#475569]│ "
tmux set-option -t "$SESSION" status-right "#[fg=#64748b]1#[fg=#94a3b8]:backend #[fg=#64748b]2#[fg=#94a3b8]:frontend #[fg=#64748b]3#[fg=#94a3b8]:mongo #[fg=#64748b]5#[fg=#94a3b8]:restart #[fg=#64748b]0#[fg=#94a3b8]:quit "
tmux set-option -t "$SESSION" window-status-format "#[fg=#64748b] #I:#W "
tmux set-option -t "$SESSION" window-status-current-format "#[fg=#f8fafc,bg=#334155,bold] #I:#W "
tmux set-option -t "$SESSION" status-left-length 25
tmux set-option -t "$SESSION" status-right-length 80

tmux select-window -t "$SESSION:1"
tmux attach -t "$SESSION"

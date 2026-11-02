#!/data/data/com.termux/files/usr/bin/sh
# ./start.sh ник_аккаунта  — обновляет книгу с GitHub и запускает мост
cd "$(dirname "$0")"
git pull --ff-only
[ -d node_modules/ws ] || npm install
node bridge.js "$@"

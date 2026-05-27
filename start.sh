#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "Instalando dependências..."
  npm install
fi

cleanup() {
  echo ""
  echo "Encerrando serviços..."
  kill 0 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Iniciando backend (Express) em http://localhost:8787"
npm run dev:server &

echo "Iniciando frontend (Vite) em http://localhost:5173"
npm run dev &

wait

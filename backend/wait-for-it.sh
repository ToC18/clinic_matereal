#!/usr/bin/env bash
# wait-for-it.sh - ожидание доступности хоста и порта
set -e

host="$1"
shift
port="$1"
shift
cmd="$@"

until nc -z "$host" "$port"; do
  echo "Waiting for $host:$port..."
  sleep 1
done

exec $cmd

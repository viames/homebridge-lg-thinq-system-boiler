#!/bin/sh
set -eu

restore_terminal() {
  stty echo 2>/dev/null || true
}

trap restore_terminal EXIT HUP INT TERM

printf 'LG ThinQ Personal Access Token: ' >&2
stty -echo
IFS= read -r THINQ_PAT
stty echo
printf '\n' >&2

export THINQ_PAT
export THINQ_COUNTRY="${THINQ_COUNTRY:-IT}"
node ./scripts/inspect-device.mjs
unset THINQ_PAT


#!/bin/sh
set -eu
app_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
cd "$app_dir"
bun run build
bun run translations:check
for language in en es zz; do
  env -u WALLSHADER_LOCALEDIR LC_ALL=en_US.UTF-8 LANGUAGE="$language" gjs -m tests/i18n.js "$language"
done
# The renderer bundle resolves its own catalogs, independently of the launcher.
env -u WALLSHADER_LOCALEDIR LC_ALL=en_US.UTF-8 LANGUAGE=es gjs -m tests/i18n.js es extension
LC_ALL=C LANGUAGE=es gjs -m tests/i18n.js en

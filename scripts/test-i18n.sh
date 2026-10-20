#!/bin/sh
set -eu
app_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
cd "$app_dir"
test_dir=$(mktemp -d /tmp/wallshader-i18n-test.XXXXXX)
trap 'rm -rf -- "$test_dir"' EXIT HUP INT TERM
export GSETTINGS_BACKEND=memory
export XDG_CONFIG_HOME="$test_dir/config"
export XDG_DATA_HOME="$test_dir/data"
export XDG_CACHE_HOME="$test_dir/cache"
bun run build
bun run translations:check
languages=$(sed 's/#.*//' po/LINGUAS)
for language in en $languages zz; do
  env -u WALLSHADER_LOCALEDIR LC_ALL=en_US.UTF-8 LANGUAGE="$language" gjs -m tests/i18n.js "$language"
  # Each desktop renderer catalog must work without the installed app's locale path.
  env -u WALLSHADER_LOCALEDIR LC_ALL=en_US.UTF-8 LANGUAGE="$language" gjs -m tests/i18n.js "$language" extension
done
LC_ALL=C LANGUAGE=es gjs -m tests/i18n.js en
python3 tests/language-startup.py

#!/usr/bin/env bash
# ------------------------------------------------------------------
# Builds a production version of this fork into an output folder,
# ready to be published as a static website (e.g. GitHub Pages).
#
# usage: scripts/deploy-fork.sh <output-dir>
#   env LOGIN_SERVER_URL: URL of the own login/sync server (superlogin/start.js).
#       If not set, online login is disabled (only offline users on the device).
#
# Source files are only changed temporarily and restored afterwards.
# The official domain (CNAME grid.asterics.eu) is NOT included.
# ------------------------------------------------------------------
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"
OUT="${1:?usage: scripts/deploy-fork.sh <output-dir>}"
LOGIN_SERVER_URL="${LOGIN_SERVER_URL:-https://login-server-not-configured.invalid}"
VERSION="fork-$(date +%Y-%m-%d-%H.%M)"
# files changed temporarily: backed up (incl. uncommitted changes) and restored at the end
TOUCHED="src/js/util/constants.js src/vue-components/views/aboutView.vue serviceWorker.js serviceWorkerCachePaths.js"
BACKUP="$(mktemp -d)"
for f in $TOUCHED; do mkdir -p "$BACKUP/$(dirname "$f")"; cp "$f" "$BACKUP/$f"; done
cp -r app/build "$BACKUP/app-build"

restore() {
    for f in $TOUCHED; do cp "$BACKUP/$f" "$f"; done
    rm -rf app/build && cp -r "$BACKUP/app-build" app/build
    rm -rf "$BACKUP"
}
trap restore EXIT

sed -i -e "s#\#ASTERICS_GRID_VERSION\##$VERSION#g" src/js/util/constants.js src/vue-components/views/aboutView.vue serviceWorker.js
sed -i -e "s/#ASTERICS_GRID_ENV#/PROD/g" src/js/util/constants.js
sed -i -e "s#\#ASTERICS_GRID_LOGIN_SERVER\##$LOGIN_SERVER_URL#g" src/js/util/constants.js

echo "building $VERSION ..."
rm -rf app/build
npx webpack --config webpack.config.js --env production
node scripts/getServiceWorkerCachePaths.js

echo "copying to $OUT ..."
mkdir -p "$OUT"
cp index.html unsupported.html serviceWorker.js serviceWorkerCachePaths.js "$OUT/"
cp -r app "$OUT/"
touch "$OUT/.nojekyll"
echo "done: $OUT ($VERSION)"

#!/usr/bin/env sh
DIR=`dirname $0`
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`
APP=$DIR/..
set -e

VERSION=`node scripts/version.cjs`
echo "<template>v$VERSION</template>" | tee $APP/src/components/Version.vue

echo "$SCRIPT: vite build"
vite build

echo $VERSION > $APP/dist/version

cat > $APP/dist/.gitignore <<CATEOF
local
node_modules
CATEOF

git add -A $APP/dist $APP/src/components/Version.vue

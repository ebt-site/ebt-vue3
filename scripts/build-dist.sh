#!/usr/bin/env sh
DIR=`dirname $0`
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`
APP=$DIR/..
set -e

VERSION=`node scripts/version.cjs`
#echo "<template>v$VERSION</template>" | tee $APP/src/components/Version.vue

echo "$SCRIPT: vite build"
vite build

echo $VERSION > $APP/dist/version
cp package.json dist
cp -r src/i18n dist/assets/



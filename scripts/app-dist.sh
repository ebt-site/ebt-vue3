#!/usr/bin/env sh
DIR=`dirname $0`
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`
set -e

echo -e "$SCRIPT: BEGIN `date`"

if [ ! -e 'package.json' ]; then
  echo -e "$SCRIPT: package.json not found in current folder (ERROR)"
  exit 911
fi

VERSION=`node $DIR/app-version.cjs`
echo -e "$SCRIPT: version $VERSION"

echo "$SCRIPT: vite build"
vite build

echo $VERSION > dist/version
cp package.json dist
I18N="realpath node_modules/ebt-vue3/src/i18n"
if [ -e "$I18N" ]; then
  echo -e "$SCRIPT: copying $I18N"
  cp -r $I18N dist/assets/
fi
I18N="realpath src/i18n"
if [ -e "$I18N" ]; then
  echo -e "$SCRIPT: copying $I18N"
  cp -r $I18N dist/assets/
fi

echo -e "$SCRIPT: END `date`"


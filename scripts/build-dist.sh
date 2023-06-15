#!/usr/bin/env sh
DIR=`dirname $0`
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`
set -e

if [ ! -e 'package.json' ]; then
  echo -e SCRIPT: this script must be run from application folder
  exit 911
fi

echo -e $SCRIPT: BEGIN `date`

VERSION=`node $DIR/version.cjs`

echo "$SCRIPT: vite build"
vite build

echo $VERSION > dist/version
cp package.json dist
cp -r src/i18n dist/assets/

echo -e $SCRIPT: END `date`


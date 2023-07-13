#!/bin/bash
DIR=`dirname $0`
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`
set -e

if [ ! -e 'package.json' ]; then
  echo -e "$SCRIPT: package.json not found in current folder (ERROR)"
  exit 911
fi

echo -e "$SCRIPT: BEGIN `date`"

VERSION=`node scripts/version.cjs`
echo -e "$SCRIPT: version $VERSION"

echo "$SCRIPT: vite build"
vite build

echo $VERSION > dist/version
cp package.json dist
cp -r $DIR/../src/i18n dist/assets/

echo -e "$SCRIPT: END `date`"


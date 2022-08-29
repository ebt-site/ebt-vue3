#!/usr/bin/env sh
DIR=`dirname $0`
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`

APP=$DIR/..

git status | grep "up to date"; RC=$?

set -e # Fail on error

if [ "$RC" != "0" ]; then
  echo "$SCRIPT: ERROR: local changes have not been pushed"
  exit 1
fi

echo "$SCRIPT: pushing to gh-pages"
git subtree push --prefix dist origin gh-pages
git checkout gh-pages
git pull
git checkout main

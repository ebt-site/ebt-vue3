#!/bin/bash
DIR=`dirname $0`
pushd $DIR/..
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`

if [ ! -e 'package.json' ]; then
  echo -e "$SCRIPT: package.json not found in current folder (ERROR)"
  exit 911
fi

git status | grep 'nothing to commit' > /dev/null; RC=$?
if [ "$RC" == "0" ]; then
  echo "$SCRIPT: Nothing to commit"
  exit 0
fi

echo "$SCRIPT: committing..."
git commit -am "$SCRIPT"
npm version patch
VERSION=`$DIR/version`
git reset --soft HEAD~1
git commit --amend -m "$SCRIPT: v$VERSION"
git push

if [ "$1" == "-npm" ]; then
  echo $SCRIPT: updating npm...
  $DIR/npm-publish.sh
else
  echo $SCRIPT: skipping npm update
  exit 0
fi

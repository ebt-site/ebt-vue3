#!/bin/bash
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`

echo -e "$SCRIPT: BEGIN `date`"

if [ ! -e 'package.json' ]; then
  echo -e "$SCRIPT: package.json not found in current folder (ERROR)"
  exit 911
fi

git status | grep 'nothing to commit' > /dev/null; RC=$?
if [ "$RC" == "0" ]; then
  echo "$SCRIPT: Nothing to commit"
  exit 0
fi

echo "$SCRIPT: committing changes to `pwd`"
git commit -am "$SCRIPT"
npm version patch
VERSION=`node scripts/app-version.cjs`
COMMIT_TAG="$SCRIPT: v$VERSION"
git reset --soft HEAD~1
git commit --amend -m COMMIT_TAG
echo -e COMMIT_TAG
git push

if [ "$1" == "-npm" ]; then
  echo $SCRIPT: updating npm...
  npm run app:publish
else
  echo $SCRIPT: skipping npm update
  exit 0
fi

echo -e "$SCRIPT: END `date`"

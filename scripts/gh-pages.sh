#!/usr/bin/env sh
DIR=`dirname $0`
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`

APP=$DIR/..

git status | grep "up to date"; RC=$?

#set -e # Fail on error
#
#if [ "$RC" != "0" ]; then
#  echo "$SCRIPT: ERROR: local changes have not been pushed"
#  exit 1
#fi

#echo "$SCRIPT: pushing to gh-pages"
#git subtree push --prefix dist origin gh-pages
#git checkout gh-pages
#git pull
#git checkout main


SCRIPT=`basename $0`
echo -e "$SCRIPT: BEGIN"

git checkout main
git status | grep "up to date"; RC=$?
set -e # exit on error
if [ "$RC" != "0" ]; then
  echo "$SCRIPT: ERROR: local changes have not been pushed"
  exit 1
fi

echo -e "$SCRIPT: generating static build..."
npm run build:dist

echo -e "$SCRIPT git checkout gh-pages"
git checkout gh-pages; git pull
BRANCH=`git rev-parse --abbrev-ref HEAD`
if [ "$BRANCH" != "gh-pages" ]; then
  echo -e "$SCRIPT: ERROR could not checkout gh-pages"
  exit -1
fi
echo -e "$SCRIPT: git branch: $BRANCH"

echo -e "$SCRIPT: removing existing content"
rm -rf assets audio fonts img 

echo -e "$SCRIPT: copying new content"
cp -r dist/* .
ls -l

echo -e "$SCRIPT: updating github"
git add .
git commit -m "gh-pages"
git push
git checkout main

echo -e "$SCRIPT END"

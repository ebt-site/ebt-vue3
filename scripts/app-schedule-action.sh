#!/bin/bash
DIR=`dirname $0`; 
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`
echo -e "${SCRIPT}: BEGIN `date`"

set -e

git pull
echo -e "${SCRIPT}: updating dependencies..."
npm install --save \
  ebt-vue3@latest \
  vuetify@latest

CMD="git status | grep 'nothing to commit' > /dev/null"
if bash -c "$CMD"; then
  echo "$SCRIPT: Nothing to commit (OK)"
  exit 0
fi

echo -e "$SCRIPT: updated package dependencies"
git commit -am "$SCRIPT: updated package dependencies"
VERSION=`npm version patch`
echo -e "$SCRIPT: committing package version ${VERSION}"
git push

echo -e "${SCRIPT}: END `date`"

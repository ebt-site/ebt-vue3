#!/bin/bash
DIR=`dirname $0`; 
APPDIR="$DIR/.."
pushd $APPDIR
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`
echo -e "${SCRIPT}: BEGIN `date`"

set -e

git pull
echo -e "${SCRIPT}: updating dependencies..."
npm install 

npm run app:dist
npm run app:html
npm run app:commit 
npm run app:pages

echo -e "${SCRIPT}: END `date`"

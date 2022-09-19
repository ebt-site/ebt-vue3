#!/bin/bash
DIR=`dirname $0`
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`
APPDIR=$DIR/..

echo -e "$SCRIPT: updating voices.json"
URL=https://raw.githubusercontent.com/sc-voice/scv-server/main/words/voices.json
KEYS="name label langTrans gender iVoice locale service"
curl -s $URL | json -a -o json json-2 $KEYS > $APPDIR/src/auto/voices.json

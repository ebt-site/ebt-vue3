#!/bin/bash
DIR=`dirname $0`
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`
APP=$DIR/..
set -e

echo -e "$SCRIPT: BEGIN `date`"

set -e

SOURCE=$1
DESTINATION=$2
if [ "$DESTINATION" == "" ]; then
  DESTINATION=public/fonts
fi
FILENAME=$(basename "${SOURCE%.otf}")
FAMILY=`basename -s .otf $SOURCE`

HELP="$SCRIPT: EXPECTED => $SCRIPT input.otf /path/to/output/"
# we omit mime check since we use this script only locally and assume it's otf
if [ -e $SOURCE ]; then
  echo -e "$SCRIPT: Converting OTF font to WOFF, WOFF2"
  echo -e "$SCRIPT: input  => $SOURCE"
  echo -e "$SCRIPT: output => $DESTINATION/$FAMILY"
else
  echo $HELP
  exit 1
fi

mkdir -p $DESTINATION/$FAMILY

if type mkeot >& /dev/null; then
  echo -e "$SCRIPT: mkeot found (OK)"
else
  echo -e "$SCRIPT: installing eot-utils..."
  sudo apt-get install -y eot-utils
fi
if type sfnt2woff >& /dev/null; then
  echo -e "$SCRIPT: sfnt2woff found (OK)"
else
  echo -e "$SCRIPT: installing woff-utils..."
  sudo apt-get install -y woff-tools
fi
if type woff2_compress >& /dev/null; then
  echo -e "$SCRIPT: woff2_compress found (OK)"
else
  echo -e "$SCRIPT: installing woff2..."
  sudo apt-get install -y woff2
fi

EOT_PATH="$DESTINATION/$FAMILY/$FILENAME.eot"
mkeot ${SOURCE} > ${EOT_PATH}
echo -e "$SCRIPT: ${EOT_PATH}"

TTF_PATH="$DESTINATION/$FAMILY/$FILENAME.ttf"
eot2ttf ${EOT_PATH} ${TTF_PATH}
echo -e "$SCRIPT: ${TTF_PATH}"

WOFF_PATH="$DESTINATION/$FAMILY/$FILENAME.woff"
sfnt2woff ${SOURCE} > ${WOFF_PATH}
echo -e "$SCRIPT: ${WOFF_PATH}"

WOFF2_PATH="$DESTINATION/$FAMILY/$FILENAME.woff2"
woff2_compress ${TTF_PATH} > ${WOFF2_PATH} 
echo -e "$SCRIPT: ${WOFF2_PATH}"

echo -e "$SCRIPT: END `date`"

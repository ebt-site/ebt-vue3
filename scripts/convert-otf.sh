#!/bin/bash
DIR=`dirname $0`
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`
APP=$DIR/..
set -e

echo -e "$SCRIPT: BEGIN `date`"

set -e

HELP="$SCRIPT: EXPECTED => $SCRIPT input.otf /path/to/output/"

SOURCE=$1
if [ "$SOURCE" == "" ]; then
  echo $HELP
  exit 1
fi

DESTINATION=$2
if [ "$DESTINATION" == "" ]; then
  DESTINATION=public/fonts
fi

# we omit mime check since we use this script only locally and assume it's otf
if [ -e $SOURCE ]; then
  echo -e "$SCRIPT: Converting OTF font to WOFF, WOFF2"
  echo -e "$SCRIPT: input  => $SOURCE"
  echo -e "$SCRIPT: output => $DESTINATION/$FAMILY"
else
  echo $HELP
  exit 1
fi

FILENAME=$(basename "${SOURCE%.otf}")
FAMILY=`basename -s .otf $SOURCE | sed -e "s/-.*//"`
mkdir -p $DESTINATION/$FAMILY

if type fontforge >& /dev/null; then
  echo -e "$SCRIPT: fontforge found (OK)"
else
  echo -e "$SCRIPT: installing fontforge..."
  sudo apt-get install -y fontforge
fi
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
echo -e "$SCRIPT: `ls -s ${EOT_PATH}`"

TTF_PATH="$DESTINATION/$FAMILY/$FILENAME.ttf"
fontforge -lang=ff -c 'Open($1); Generate($2); Close();' ${SOURCE} ${TTF_PATH}
echo -e "$SCRIPT: `ls -s ${TTF_PATH}`"

WOFF_PATH="$DESTINATION/$FAMILY/$FILENAME.woff"
sfnt2woff ${SOURCE} 
mv "`dirname $SOURCE`/$FILENAME.woff" ${WOFF_PATH}
echo -e "$SCRIPT: `ls -s ${WOFF_PATH}`"

WOFF2_PATH="$DESTINATION/$FAMILY/$FILENAME.woff2"
woff2_compress ${TTF_PATH} 
echo -e "$SCRIPT: `ls -s ${WOFF2_PATH}`"

echo -e "$SCRIPT: END `date`"

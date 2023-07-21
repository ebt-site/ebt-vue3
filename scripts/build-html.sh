#!/bin/bash

DIR=`dirname $0`
SCRIPT=`basename $0`

echo -e "$SCRIPT: BEGIN `date`"

if [ ! -e 'package.json' ]; then
  echo -e "$SCRIPT: package.json not found in current folder (ERROR)"
  exit 911
fi

if [ ! -e 'ebt-config.mjs' ]; then
  echo -e "$SCRIPT: ebt-config.mjs not found (ERROR)"
  exit 911
fi

CONFIG_PATH=`realpath ebt-config.mjs`
echo -e $SCRIPT: configuration $CONFIG_PATH

DSTDIR=`realpath public/content`
echo -e $SCRIPT: removing generated HTML $DSTDIR ...
rm -rf $DSTDIR
mkdir -p $DSTDIR

SRCDIR=`realpath content`
echo -e $SCRIPT: generating HTML files ...
node $DIR/build-html.mjs $SRCDIR $DSTDIR $CONFIG_PATH

echo -e "$SCRIPT: END `date`"

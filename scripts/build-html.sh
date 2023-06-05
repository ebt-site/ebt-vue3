#!/bin/bash

DIR=`dirname $0`
SCRIPT=`basename $0`
CONFIG_PATH=`realpath ${DIR}/../ebt-config.mjs`
SRCDIR=`realpath ${DIR}/../content`
DSTDIR=`realpath ${DIR}/../public/content`

echo -e $SCRIPT: configuration $CONFIG_PATH

echo -e $SCRIPT: removing generated HTML $DSTDIR ...
rm -rf $DSTDIR
mkdir -p $DSTDIR

echo -e $SCRIPT: generating HTML files ...
node $DIR/build-html.mjs $SRCDIR $DSTDIR $CONFIG_PATH

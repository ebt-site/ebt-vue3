#!/bin/bash
DIR=`dirname $0`
rm -rf public/content
node $DIR/build-html.mjs

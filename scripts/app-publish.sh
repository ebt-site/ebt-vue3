#!/bin/bash
SCRIPT=`basename $0 | tr abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ`

echo -e "$SCRIPT: BEGIN `date`"

if [ ! -e 'package.json' ]; then
  echo -e "$SCRIPT: package.json not found in current folder (ERROR)"
  exit 911
fi

PUBVER=`npm view | grep latest | sed s/^.*:.//`
PKGVER=`grep version package.json | head -1 | sed s/[^0-9.]//g`
if [ "$PUBVER" == "PKGVER" ]; then
  echo "$SCRIPT: $PKGVER no change"
elif [ "$NODE_AUTH_TOKEN" != "" ]; then
  echo "$SCRIPT: npm publish $PUBVER => $PKGVER (NODE_AUTH_TOKEN ok)"
  npm publish
else 
  echo "$SCRIPT: npm publish v$PKGVER (requires npm login)"
  npm publish
fi

echo -e "$SCRIPT: END `date`"

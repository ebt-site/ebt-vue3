#!/bin/bash
DIR=`dirname $0`
DOCKER_BUILDKIT=1 docker build . -t ebt-vue3

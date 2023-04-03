<template>{{version()}}</template>

<script setup>
  import * as pkg from "../../package.json"
  function version() {
    return pkg.version;
  }
</script>

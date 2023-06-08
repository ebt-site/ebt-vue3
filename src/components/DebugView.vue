<template>
  <v-sheet class="debug-card">
    <div>
      <h3>Actions</h3>
      {{message}}
      <div class="buttons">
        <v-btn @click="clickBell" variant="outlined">
          Audio Bell 
        </v-btn>
      </div>

      <h3 class="mt-4"> Layout </h3>
      Layout: {{volatile.displayBox}}

      <h3 class="mt-4">Links</h3>
      <div style="width: 20em">
        <div v-for="link in testLinks">
          <a :href="link">{{link.replace(/#/,'')}}</a>
        </div>
      </div>
    </div>
  </v-sheet>
</template>

<script>
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useAudioStore } from '../stores/audio.mjs';
  import { useVolatileStore } from '../stores/volatile.mjs';
  import { default as IdbAudio } from '../idb-audio.mjs';
  import { SuttaRef } from 'scv-esm';
  import { logger } from 'log-instance/index.mjs';
  import { ref } from "vue";

  export default {
    setup() {
      return {
        settings: useSettingsStore(),
        audio: useAudioStore(),
        volatile: useVolatileStore(),
        message: ref(''),
      }
    },
    components: {
    },
    methods: {
      updateMessage(msg) {
        this.message = msg;
        logger.info(msg);
      },
      clickBell() {
        let { audio } = this;
        audio.playBell();
      },
    },
    mounted() {
    },
    computed: {
      testLinks: (ctx) => [
        "#/debug",
        "#/",
        "#/wiki",
        "#/sutta",
        "#/sutta/sn24.11:3.1",
        "#/sutta/mn44:0.1",
        "#/sutta/mn44:10.2",
        "#/sutta/mn44:20.1",
        "#/search",
        "#/search/DN33",
        "#/wiki/welcome",
        "#/wiki/about",
        "#/sutta/DN33",
        "#/search/root%20of%20suffering",
      ],
    },
  }
</script>

<style scoped>
.debug-card {
  max-width: 40em;
  margin-left: auto;
  margin-right: auto;
}
.buttons {
  display: flex;
  flex-flow: column;
}
.buttons .v-btn {
  margin: 0.5em;
}
</style>


<template>
  <v-sheet class="debug-card">
    <div>
      <h3>DEBUG VIEW</h3>

      <div class="buttons">
        <v-btn @click="clickTestLoadSettings" variant="outlined">
          Test Load Settings
        </v-btn>
        <v-btn @click="clickCards" variant="outlined">
          Cards
        </v-btn>
        <v-btn @click="clickPlayArrayBuffer" variant="outlined">
          Play ArrayBuffer
        </v-btn>
      </div>


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
  import { SuttaRef } from 'scv-esm';
  import { logger } from 'log-instance';
  import { ref } from "vue";

  export default {
    setup() {
      return {
        settings: useSettingsStore(),
        audio: useAudioStore(),
        volatile: useVolatileStore(),
      }
    },
    components: {
    },
    methods: {
      async clickPlayArrayBuffer() {
        let { audio, volatile } = this;
        let suttaRef = SuttaRef.create('thig1.1:0.1/en/sujato');
        let segAudio = await audio.fetchSegmentAudio(suttaRef);
        let audioContext = new AudioContext();
        let paliUrl = await audio.langAudioUrl(suttaRef, 'pli');
        try {
          let arrayBuffer = await audio.fetchAudioBuffer(paliUrl);
          await audio.playArrayBuffer({arrayBuffer, audioContext});
        } catch(e) {
          logger.warn(e.message);
          volatile.alert(e.message);
        }
      },
      clickTestLoadSettings() {
        let { settings } = this;
        settings.loadSettings();
      },
      clickCards() {
        let { settings } = this;
        console.log("DEBUG clickCards()", JSON.stringify(settings.cards, null, 2));
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
  margin: 1em;
}
</style>


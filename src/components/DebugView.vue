<template>
  <v-sheet class="debug-card">
    <div>
      <h3>DEBUG VIEW</h3>

      {{message}}
      <div class="buttons">
        <v-btn @click="clickTestLoadSettings" variant="outlined">
          Test Load Settings
        </v-btn>
        <v-btn @click="clickCards" variant="outlined">
          Cards
        </v-btn>
        <v-btn @click="clickPlayScid" variant="outlined">
          Play {{scid}}/{{lang}}
        </v-btn>
        <v-text-field label="scid" v-model="scid" />
        <v-text-field label="lang" v-model="lang" />
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
        scid: ref('sn1.1:0.1'),
        lang: ref('pli'),
        message: ref(''),
      }
    },
    components: {
    },
    methods: {
      async playScid(audioContext) {
        let { audio, volatile, settings, scid, lang, $t } = this;
        try {
          volatile.waitBegin($t('ebt.loadingAudio'));
          this.message = `playScid() langAudioUrl(${scid}, ${lang})`;
          let url = await audio.langAudioUrl(scid, lang);
          if (url) {
            this.message = `playScid() fetchAudioBuffer() url:${url}`;
            let arrayBuffer = await audio.fetchAudioBuffer(url);
            this.message = `playScid() playArrayBuffer ${arrayBuffer.byteLength}B`;
            await audio.playArrayBuffer({arrayBuffer, audioContext});
            this.message = "playScid() DONE";
          } else {
            this.message = `playScid() langAudioUrl(${scid}, ${lang}) => null`;
          }
        } catch(e) {
          this.message = e.message;
          logger.warn(e.message);
          volatile.alert(e.message);
        } finally {
          volatile.waitEnd();
        }
      },
      clickPlayScid() {
        let audioContext = new AudioContext();
        this.playScid(audioContext);
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
  margin: 0.5em;
}
</style>


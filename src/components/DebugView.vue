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
      updateMessage(msg) {
        this.message = msg;
        logger.info(msg);
      },
      async playScid(audioContext) {
        let { audio, volatile, settings, scid, lang, $t } = this;
        let { waiting } = volatile;
        try {
          volatile.waitBegin($t('ebt.loadingAudio'));
          this.updateMessage(`playScid() langAudioUrl(${scid}, ${lang})`);
          let url = await audio.langAudioUrl(scid, lang);
          volatile.waitEnd();
          if (url) {
            this.updateMessage(`playScid() fetchAudioBuffer() url:${url}`);
            let arrayBuffer = await audio.fetchAudioBuffer(url);
            this.updateMessage(`playScid() playArrayBuffer ${arrayBuffer.byteLength}B`);;
            await audio.playArrayBuffer({arrayBuffer, audioContext});
            this.updateMessage("playScid() DONE");
          } else {
            this.updateMessage(`playScid() langAudioUrl(${scid}, ${lang}) => null`);
          }
        } catch(e) {
          volatile.alert(e);
        } finally {
          volatile.waiting > waiting && volatile.waitEnd();
        }
      },
      clickPlayScid() {
        let { volatile } = this;
        let audioContext = volatile.getAudioContext();
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


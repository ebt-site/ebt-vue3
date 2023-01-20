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
        <v-btn @click="clickPause" variant="outlined">
          Pause {{audioContextState}} {{audioContextCurrentTime.toFixed(2)}}
        </v-btn>
        <v-text-field label="scid" v-model="scid" />
        <v-text-field label="lang" v-model="lang" />
        <v-btn @click="clickPlayIdbAudio" variant="outlined">
          IdbAudio Play {{scid}}/{{lang}}
        </v-btn>
        <v-btn @click="clickPauseIdbAudio" variant="outlined">
          IdbAudio Pause {{audioContextState}} {{audioContextCurrentTime.toFixed(2)}}
        </v-btn>
        <v-btn @click="clickBell" variant="outlined">
          Audio Bell 
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
  import { default as IdbAudio } from '../idb-audio.mjs';
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
        audioContext: ref(undefined),
        audioContextState: ref('unknown'),
        audioContextCurrentTime: ref(-1),
        idbAudio: undefined,
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
        const msg = 'DebugView.playScid() ';
        let { audio, volatile, settings, scid, lang, $t } = this;
        let { waiting } = volatile;
        try {
          volatile.waitBegin($t('ebt.loadingAudio'));
          this.updateMessage(`${msg} langAudioUrl(${scid}, ${lang})`);
          let url = await audio.langAudioUrl({idOrRef:scid, lang});
          volatile.waitEnd();
          if (url) {
            this.updateMessage(`playScid() fetchArrayBuffer() url:${url}`);
            let arrayBuffer = await audio.fetchArrayBuffer(url);
            this.updateMessage(`playScid() playArrayBuffer ${arrayBuffer.byteLength}B`);;
            console.log("DBG0104 audioContext.state before playArrayBuffer", 
              audioContext.state);
            await audio.playArrayBuffer({arrayBuffer, audioContext});
            console.log("DBG0104 audioContext.state after playArrayBuffer", 
              audioContext.state);
            this.audioContextState = audioContext.state;
            this.audioContextCurrentTime = audioContext.currentTime;
            this.updateMessage("playScid() DONE");
          } else {
            this.updateMessage(`${msg} langAudioUrl(${scid}, ${lang}) => null`);
          }
        } catch(e) {
          volatile.alert(e);
        } finally {
          volatile.waiting > waiting && volatile.waitEnd();
        }
      },
      clickBell() {
        let { audio } = this;
        console.log("DBG0111 clickBell() start");
        audio.playBell().then(()=>{
          console.log("DBG0111 clickBell() end");
        });
      },
      async clickPause() {
        let { audioContext } = this;
        switch (audioContext.state) {
          case 'suspended':
            await audioContext.resume();
            break;
          case 'running':
            await audioContext.suspend();
            break;
          default:
          case 'closed':
            logger.warn("Debug.clickPause() IGNORED:", audioContext.state); 
            break;
        }
        this.audioContextState = audioContext.state;
        this.audioContextCurrentTime = audioContext.currentTime;
      },
      clickPlayScid() {
        let { audio } = this;
        let audioContext = audio.getAudioContext();
        this.audioContext = audioContext;
        console.log("DBG0104 audioContext.state", audioContext.state);
        audioContext.resume();
        this.playScid(audioContext);
      },
      async playIdbAudio(audioContext) {
        let { audio, volatile, settings, scid, lang, $t } = this;
        try {
          let src = await audio.langAudioUrl({idOrRef:scid, lang});
          console.log("DBG0109 playIdbAudio()", src);
          let idbAudio = new IdbAudio({src, audioContext});
          this.idbAudio = idbAudio;
          console.log("DBG0109 playIdbAudio() play()");
          await idbAudio.play();
          console.log("DBG0109 playIdbAudio() done");
        } catch(e) {
          console.log(e);
        }
      },
      clickPlayIdbAudio() {
        let audioContext = new AudioContext();
        this.audioContext = audioContext;
        this.playIdbAudio(audioContext);
      },
      clickPauseIdbAudio() {
        let { idbAudio } = this;
        if (idbAudio.paused) {
          idbAudio.play();
        } else {
          idbAudio.pause();
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
  margin: 0.5em;
}
</style>


<template>
  <v-sheet id="ebt-cards" color="background" :class="cardsClass" >
    <div v-for="card in settings.cards">
      <ebt-card-vue :card="card" />
    </div><!-- v-for card -->
    <v-bottom-navigation v-if="playScid" 
      class="play-nav" 
      hide-on-scroll
      dense
    >
      <v-btn icon @click="clickPlayPause">
        <v-icon icon="mdi-play-pause" />
      </v-btn>
      <div class="play-scid">
        {{playScid}}
      </div>
      <v-btn icon @click="clickPlay">
        <v-icon icon="mdi-play" />
      </v-btn>
    </v-bottom-navigation>
  </v-sheet>
</template>

<script>
  import { ref, nextTick } from "vue";
  import { default as EbtCard } from '../ebt-card.mjs';
  import { default as EbtCardVue } from './EbtCard.vue';
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useVolatileStore } from '../stores/volatile.mjs';
  import { logger } from "log-instance";

  // TODO: Apple doesn't support AudioContext symbol
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const URL_NOAUDIO = "audio/383542__alixgaus__turn-page.mp3"
  const PAT_NOAUDIO = ['ac87a767581710d97b8bf190fd5e109c']; // Amy
  const LENGTH_NOAUDIO = 5000; // actually 3761

  export default {
    setup() {
      return {
        settings: useSettingsStore(),
        volatile: useVolatileStore(),
        playScid: ref(undefined),
        theAudioContext: ref(undefined),
        reNoAudio: new RegExp(PAT_NOAUDIO.join('|')),
        audioSource: undefined,
      }
    },
    mounted() {
      let { settings, $route }  = this;
      let { params, fullPath }  = $route;
      let { cards } = settings;
      let card = EbtCard.pathToCard({
        path:fullPath, 
        cards, 
        defaultLang: settings.langTrans,
        addCard: (opts) => settings.addCard(opts),
      });
      this.playScid = this.routeScid(window.location.hash);

      logger.info("EbtCards.mounted", this);

      if (card == null) {
        //window.location.hash = '';
        logger.warn("EbtCards.mounted UNEXPECTED", fullPath);
      } else {
        nextTick(() => {
          settings.scrollToCard(card);
        });
      }
    },
    methods: {
      async clickPlayPause() {
        logger.info("EbtCards.clickPlayPause()");
        await this.playUrl(URL_NOAUDIO);
        let route = window.location.hash;
        logger.info("EbtCards.clickPlayPause() => OK", {route});
      },
      async clickPlay() {
        logger.info("EbtCards.clickPlay()");
        this.playUrl(URL_NOAUDIO);
      },
      async playUrl(url) { 
        try {
          let { patNoAudio, reNoAudio, audioContext, volatile } = this;
          let length = 0;
          let numberOfChannels = 2;
          let sampleRate = 48000;

          if (reNoAudio.test(url)) {
            url = URL_NOAUDIO;
          }
          let headers = new Headers();
          headers.append('Accept',  'audio/mpeg');

          let res = await volatile.fetch(url, { headers });
          if (!res.ok) {
             let e = new Error(`playUrl(${url}) ERROR => HTTP${res.status}`);
             e.url = url;
             throw e;
          }
          let urlBuf = await res.arrayBuffer();
          let audioSource = audioContext.createBufferSource();
          this.audioSource = audioSource;
          let urlAudio = await new Promise((resolve, reject)=>{
            audioContext.decodeAudioData(urlBuf, resolve, reject);
          });
          numberOfChannels = Math.min(numberOfChannels, urlAudio.numberOfChannels);
          length += urlAudio.length;
          sampleRate = Math.max(sampleRate, urlAudio.sampleRate);
          console.debug(`playUrl(${url})`, {sampleRate, length, numberOfChannels});
          if (length < LENGTH_NOAUDIO) {
            let guid = url.split('/').pop();
            patNoAudio.push(guid);
            logger.info(`EbtCards.playUrl() patNoAudio => `, patNoAudio);
            this.reNoAudio = new RegExp(patNoAudio.join('|'));
            return await this.playUrl(URL_NOAUDIO);
          }

          let msg = [
            `audioContext.createBuffer`,
            JSON.stringify({numberOfChannels, length, sampleRate}),
          ].join(' ');
          let audioBuffer = audioContext
            .createBuffer(numberOfChannels, length, sampleRate);
          for (let iChannel = 0; iChannel < numberOfChannels; iChannel++) {
            let offset = 0;
            msg = [
              `new Float32Array`,
              typeof Float32Array,
              typeof window.Float32Array,
              Float32Array == null ? "null" : "OK",
            ].join(' ');
            let channelData = new Float32Array(length);
            channelData.set(urlAudio.getChannelData(iChannel), offset);
            offset += urlAudio.length;
            audioBuffer.getChannelData(iChannel).set(channelData);
          }

          audioSource.buffer = audioBuffer;
          audioSource.connect(audioContext.destination);
          return new Promise((resolve, reject) => { try {
            audioSource.onended = evt => {
              logger.debug(`EbtCards.playUrl(${url}) => OK`);
              resolve();
            };
            audioSource.start();
          } catch(e) {
            let msg = `EbtCards.playUrl(ERROR) ${url} could not start() => ${e.message}`;
            logger.error(msg);
            alert(msg);
            reject(e);
          }}); // Promise
        } catch(e) {
          let msg = `EbtCards.playURL(ERROR) ${url} => ${e.message}`;
          logger.info(msg);
          throw e;
        }
      }, // playUrl()
      routeScid: (route) => {
        let hashParts = route.split("/");
        if (hashParts[0] === '#') {
          hashParts.shift();
        }
        let [ context, loc0, loc1, loc2 ] = hashParts;
        return context === EbtCard.CONTEXT_SUTTA ? loc0 : null;
      },
    },
    computed: {
      audioContext(ctx) {
        let { theAudioContext:ac } = ctx;
        if (ac == null) {
          ac = new AudioContext();
          ctx.theAudioContext = ac;
        }
        return ac;
      },
      cardsClass(ctx) {
        let { settings } = ctx;
        return settings.cardsOpen === 1 
          ? "ebt-cards ebt-cards1" 
          : "ebt-cards";
      },
    },
    watch:{
      $route (to, from) {
        let { settings, $route }  = this;
        let { cards } = settings;
        let msg = 'EbtCards.watch.$route';
        this.playScid = this.routeScid(to.href);
        let card = EbtCard.pathToCard({
          path: to.fullPath, 
          cards, 
          addCard: (opts) => settings.addCard(opts),
          defaultLang: settings.langTrans,
        });
        if (card == null) {
          window.location.hash = '';
          logger.warn(`${msg} => invalid card route`, {$route, to, from});
          return;
        }

        if (card.isOpen) {
          logger.info(`${msg} => card`, {$route, to, from, card});
        } else {
          card.isOpen = true;
          logger.info(`${msg} => opened card`, {$route, to, from, card});
        }
        nextTick(() => {
          settings.scrollToCard(card);
        })
      }
    }, 
    components: {
      EbtCardVue,
    },
  }
</script>
<style scoped>
  .ebt-cards {
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    min-height: 50em;
  }
  .ebt-cards1 {
    background-color: rgb(var(--v-theme-surface)) !important;
  }
  .play-nav {
    align-items: center;
    opacity: 1;
  }
  .play-scid {
    font-family: var(--ebt-sc-sans-font);
    font-size: larger;
    font-weight: 600;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
</style>

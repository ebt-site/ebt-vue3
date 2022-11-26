<template>
  <v-sheet id="ebt-cards" color="background" :class="cardsClass" >
    <div v-for="card in settings.cards">
      <ebt-card-vue :card="card" />
    </div><!-- v-for card -->
    <v-bottom-navigation v-if="playScid" 
      hide-on-scroll
      dense
    >
      <div class="play-col">
        <v-progress-linear :indeterminate="!!audioPlaying" 
          color="progress1" height="2px" />
        <div class="play-row">
          <v-btn icon @click="clickPlayPause" density="compact">
            <v-icon :icon="audioPlaying ? 'mdi-pause' : 'mdi-play-pause'" />
          </v-btn>
          <div class="play-scid">
            {{playScid}}
          </div>
          <v-btn icon @click="clickPlay" density="compact">
            <v-icon :icon="audioPlaying ? 'mdi-pause' : 'mdi-play'" />
          </v-btn>
        </div><!-- play-row -->
      </div><!-- play-col -->
      <audio :ref="el => {audioElt = el}" 
        @emptied = "audioEmptied"
        @ended = "audioEnded"
        preload=auto >
        <source type="audio/mp3" :src="audioUrl" />
        <p>{{ $t('ebt.noHTML5') }}</p>
      </audio>
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
        audioElt: ref(undefined),
        audioUrl: ref(URL_NOAUDIO),
        audioPlaying: ref(false),
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
      audioEnded(evt) {
        logger.info('EbtCards.audioEnded', {evt});
        this.audioPlaying = false;
      },
      audioEmptied(evt) {
        logger.info('EbtCards.audioEmptied', {evt});
      },
      async clickPlayPause() {
        logger.info("EbtCards.clickPlayPause()", window.location.hash);
        this.playUrl(URL_NOAUDIO);
      },
      async clickPlay() {
        logger.info("EbtCards.clickPlay()", window.location.hash);
        this.playUrl(URL_NOAUDIO);
      },
      async playUrl(url=URL_NOAUDIO) {
        let that = this;
        let { audioElt } = this;
        this.audioUrl = url;

        if (audioElt) {
          audioElt.play().then(res=>{
            let msg = `EbtCards.playUrl() ${url}`;
            that.audioPlaying = true;
            logger.info(msg);
          }).catch(e=>{
            logger.info(e);
          });
        } else {
          logger.warn(`EbtCards.playUrl() audioElt?`);
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
  .play-col {
    display: flex;
    flex-flow: column nowrap;
  }
  .play-row {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
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

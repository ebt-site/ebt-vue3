<template>
  <v-sheet id="ebt-cards" color="background" :class="cardsClass" >
    <div v-for="card in settings.cards">
      <ebt-card-vue :card="card" />
    </div><!-- v-for card -->
    <v-bottom-navigation v-if="audioScid" 
      hide-on-scroll
      dense
    >
      <div class="play-col">
        <v-progress-linear v-if="audioElt"
          v-model="progressTime"
          :buffer-value="duration"
          color="progress1" height="2px" />
        <div class="play-row">
          <v-btn icon @click="clickPlayPause" density="compact">
            <v-icon :icon="audioPlaying ? 'mdi-pause' : 'mdi-play-pause'" />
          </v-btn>
          <div class="play-scid" :title="duration/1000">
            <div>{{audioScid}}</div>
            <div v-if="audioPlaying" class="progressTime">
              {{ (progressTime/1000).toFixed(1) }} / 
              {{ (duration/1000).toFixed(1) }}
            </div>
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
  import { SuttaRef } from 'scv-esm';
  import { default as EbtCard } from '../ebt-card.mjs';
  import { default as EbtCardVue } from './EbtCard.vue';
  import { useSuttasStore } from '../stores/suttas.mjs';
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useVolatileStore } from '../stores/volatile.mjs';
  import { logger } from "log-instance";

  // TODO: Apple doesn't support AudioContext symbol
  const URL_NOAUDIO = "audio/383542__alixgaus__turn-page.mp3"
  const PAT_NOAUDIO = ['ac87a767581710d97b8bf190fd5e109c']; // Amy
  const LENGTH_NOAUDIO = 5000; // actually 3761
  const AUDIO_INACTIVE = 0;
  const AUDIO_PLAY1 = 1;
  const AUDIO_PLAYALL = 2;

  export default {
    setup() {
      return {
        suttas: useSuttasStore(),
        settings: useSettingsStore(),
        volatile: useVolatileStore(),
        audioScid: ref(undefined),
        audioSegments: ref(undefined),
        routeCard: ref(undefined),
        audioElt: ref(undefined),
        audioUrl: ref(URL_NOAUDIO),
        audioPlaying: ref(AUDIO_INACTIVE),
        duration: ref(0),
        progressTime: ref(0),
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

      logger.info("EbtCards.mounted", this);

      if (card == null) {
        //window.location.hash = '';
        logger.warn("EbtCards.mounted UNEXPECTED", fullPath);
      } else {
        this.routeCard = card;
        nextTick(() => {
          settings.scrollToCard(card);
          this.bindAudioSegments(window.location.hash);
        });
      }
    },
    methods: {
      async audioEnded(evt) {
        let { routeCard, audioSegments:segments, settings, audioPlaying } = this;
        let { location } = routeCard.incrementLocation({segments});
        if (location) {
          window.location.hash = routeCard.routeHash();
        }
        if (location && this.audioPlaying === AUDIO_PLAYALL) {
          logger.info('EbtCards.audioEnded() playing', {evt, location});
        } else {
          logger.info('EbtCards.audioEnded() done', {evt, });
          this.audioPlaying = AUDIO_INACTIVE;
          this.progressTime = 0;
        }
        nextTick(() => { settings.scrollToCard(routeCard); })
      },
      audioEmptied(evt) {
        logger.info('EbtCards.audioEmptied', {evt});
      },
      async clickPlayPause() {
        logger.info("EbtCards.clickPlayPause()", window.location.hash);
        this.playUrl(URL_NOAUDIO, AUDIO_PLAY1);
      },
      async clickPlay() {
        logger.info("EbtCards.clickPlay()", window.location.hash);
        this.playUrl(URL_NOAUDIO, AUDIO_PLAYALL);
      },
      async playUrl(url=URL_NOAUDIO, audioPlaying=AUDIO_PLAY1) {
        let that = this;
        let { audioElt, } = this;

        if (!audioElt) {
          logger.warn(`EbtCards.playUrl() audioElt?`);
          return;
        } 
        if (this.audioPlaying) {
          audioElt.pause();
          audioElt.currentTime = 0;
          this.audioPlaying = AUDIO_INACTIVE;
          return;
        }

        this.audioUrl = url;
        audioElt.play().then(res=>{
          let msg = `EbtCards.playUrl()`;
          that.audioPlaying = audioPlaying;
          that.duration = (audioElt.duration*1000).toFixed();
          let updateProgressTime = ()=>{
            that.progressTime = (audioElt.currentTime*1000).toFixed();
            if (that.audioPlaying) {
              setTimeout(updateProgressTime, 100);
            } else {
              that.progressTime = 0;
            }
          };
          updateProgressTime();
          logger.info(msg, {url, audioElt});
        }).catch(e=>{
          logger.info(e);
        });
      }, // playUrl()
      routeSuttaRef(route) {
        let hashParts = route.split("/");
        if (hashParts[0] === '#') {
          hashParts.shift();
        }
        let [ context, sutta_uid, lang, author ] = hashParts;
        return context === EbtCard.CONTEXT_SUTTA
          ? SuttaRef.create({sutta_uid, lang, author})
          : null;
      },
      async bindAudioSegments(route) {
        let { routeCard, suttas } = this;
        if (routeCard?.context === EbtCard.CONTEXT_SUTTA) {
          let suttaRef = this.routeSuttaRef(route);
          let idbSutta = await suttas.loadIdbSutta(suttaRef);
          let { sutta_uid, segnum } = suttaRef;
          this.audioScid =  segnum ? `${sutta_uid}:${segnum}` : sutta_uid;
          this.audioSegments = idbSutta.segments;
        } else {
          this.audioScid = null;
          this.audioSegments = null;
        }
      },
      routeScid(route) {
        let { sutta_uid, segnum } = this.routeSuttaRef(route);
        return segnum ? `${sutta_uid}:${segnum}` : sutta_uid;
      },
    },
    computed: {
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
        let card = EbtCard.pathToCard({
          path: to.fullPath, 
          cards, 
          addCard: (opts) => settings.addCard(opts),
          defaultLang: settings.langTrans,
        });
        this.routeCard = card;
        this.bindAudioSegments(to.href);
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
        nextTick(() => { settings.scrollToCard(card); })
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
    padding-bottom: calc(80vw);
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
    display: flex;
    flex-flow: column;
    align-items: center;
    font-family: var(--ebt-sc-sans-font);
    font-size: larger;
    font-weight: 600;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
  .progressTime {
    font-weight: 400;
  }
</style>

<template>
  <v-bottom-navigation v-if="audioScid" 
    hide-on-scroll
    dense
  >
    <div class="play-col">
      <v-progress-linear v-if="audioElt"
        v-model="progressTime"
        :buffer-value="progressDuration"
        color="progress1" height="2px" />
      <div class="play-row">
        <v-btn icon @click="clickBack" density="compact">
          <v-icon size="small" icon="mdi-skip-previous" />
        </v-btn>
        <v-btn icon @click="clickPlayPause" density="compact">
          <v-icon size="small" :icon="audioPlaying ? 'mdi-pause' : 'mdi-play-pause'" />
        </v-btn>
        <div class="play-scid" >
          <div>{{audioScid}}</div>
          <div v-if="audioPlaying === AUDIO_PLAY1" class="progressTime">
            {{ (progressTime/1000).toFixed(1) }} / 
            {{ (progressDuration/1000).toFixed(1) }}
          </div>
          <div v-if="audioPlaying === AUDIO_PLAYALL" class="progressTime">
            {{ progressTime }} / 
            {{ progressDuration }}
          </div>
        </div>
        <v-btn icon @click="clickPlay" density="compact">
          <v-icon size="small" :icon="audioPlaying ? 'mdi-pause' : 'mdi-play'" />
        </v-btn>
        <v-btn icon @click="clickNext" density="compact">
          <v-icon size="small" icon="mdi-skip-next" />
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
</template>

<script>
  import { ref, nextTick } from "vue";
  import { SuttaRef } from 'scv-esm';
  import { default as EbtCard } from '../ebt-card.mjs';
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
    props: {
      audioScid: { type: String, },
      audioSegments: { type: Object, },
      routeCard: { type: Object, },
    },
    setup() {
      return {
        suttas: useSuttasStore(),
        settings: useSettingsStore(),
        volatile: useVolatileStore(),
        audioElt: ref(undefined),
        audioUrl: ref(URL_NOAUDIO),
        audioPlaying: ref(AUDIO_INACTIVE),
        progressDuration: ref(0),
        progressTime: ref(0),
        AUDIO_INACTIVE,
        AUDIO_PLAY1,
        AUDIO_PLAYALL,
      }
    },
    mounted() {
      logger.info("SuttaPlayer.mounted", this);
    },
    methods: {
      clickBack() {
        let { audioElt, routeCard, audioSegments:segments, audioPlaying } = this;
        if (audioPlaying) {
          audioElt.currentTime = 0;
        } else {
          let { location, iSegment } = routeCard.incrementLocation({
            segments,
            delta:-1,
          });
          if (location) {
            window.location.hash = routeCard.routeHash();
          }
        }
      },
      clickNext() {
        let { audioElt, routeCard, audioSegments:segments, audioPlaying } = this;
        if (audioPlaying) {
          audioLet.pause();
          audioElt.currentTime = 0;
        } 
        let { location, iSegment } = routeCard.incrementLocation({
          segments,
          delta:1,
        });
        if (location) {
          window.location.hash = routeCard.routeHash();
        }
      },
      async audioEnded(evt) {
        let { routeCard, audioSegments:segments, settings, audioPlaying } = this;
        let { location, iSegment } = routeCard.incrementLocation({segments});
        if (location) {
          window.location.hash = routeCard.routeHash();
        }
        if (location && this.audioPlaying === AUDIO_PLAYALL) {
          logger.info('SuttaPlayer.audioEnded() playing', {evt, location});
        } else {
          logger.info('SuttaPlayer.audioEnded() done', {evt, });
          this.audioPlaying = AUDIO_INACTIVE;
          this.progressTime = 0;
        }
        nextTick(() => { settings.scrollToCard(routeCard); })
      },
      audioEmptied(evt) {
        logger.info('SuttaPlayer.audioEmptied', {evt});
      },
      async clickPlayPause() {
        logger.info("SuttaPlayer.clickPlayPause()", window.location.hash);
        this.playUrl(URL_NOAUDIO, AUDIO_PLAY1);
      },
      async clickPlay() {
        logger.info("SuttaPlayer.clickPlay()", window.location.hash);
        this.playUrl(URL_NOAUDIO, AUDIO_PLAYALL);
      },
      async playUrl(url=URL_NOAUDIO, audioPlaying=AUDIO_PLAY1) {
        let that = this;
        let { audioElt, audioSegments:segments, routeCard } = this;
        let { iSegment } = routeCard.incrementLocation({ segments, delta: 0, });

        if (!audioElt) {
          logger.warn(`SuttaPlayer.playUrl() audioElt?`);
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
          let msg = `SuttaPlayer.playUrl()`;
          that.audioPlaying = audioPlaying;
          that.progressDuration = audioPlaying === AUDIO_PLAY1
            ? (audioElt.duration*1000).toFixed()
            : segments.length;
          let updateProgressTime = ()=>{
            that.progressTime = audioPlaying === AUDIO_PLAY1
              ? (audioElt.currentTime*1000).toFixed()
              : iSegment;
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
    },
    computed: {
    },
    components: {
    },
  }
</script>
<style scoped>
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
  .play-row button {
    padding: 0;
    min-width: 48px;
    max-width: 54px;
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

<template>
  <v-bottom-navigation v-if="audioScid" 
    hide-on-scroll
    dense
    class="audio-nav"
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
    <template v-for="(audioUrl,i) in audioUrls">
      <audio :ref="el => {audioElts[i] = el}" 
        @emptied = "audioEmptied"
        @ended = "audioEnded"
        preload=auto >
        <source type="audio/mp3" :src="audioUrl" />
        <p>{{ $t('ebt.noHTML5') }}</p>
      </audio>
    </template>
  </v-bottom-navigation>
</template>

<script>
  import { ref, nextTick } from "vue";
  import { SuttaRef } from 'scv-esm';
  import { default as EbtSettings } from "../ebt-settings.mjs";
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
        audioUrls: ref([]),
        audioElts: ref([null,null,null]),
        audioElt: ref(undefined),
        audioUrl: ref(URL_NOAUDIO),
        audioPlaying: ref(AUDIO_INACTIVE),
        progressDuration: ref(0),
        progressTime: ref(0),
        segmentPlaying: ref(false),
        AUDIO_INACTIVE,
        AUDIO_PLAY1,
        AUDIO_PLAYALL,
      }
    },
    mounted() {
      logger.info("SuttaPlayer.mounted", this);
    },
    methods: {
      async clickPlayPause() {
        let { audioPlaying, audioScid } = this;

        if (this.stopAudio(true)) {
          return;
        } 

        logger.info("SuttaPlayer.clickPlayPause()", audioScid);
        this.audioUrls = [ URL_NOAUDIO ];
        await new Promise(resolve=>nextTick(()=>resolve()));
        console.log("DEBUG clickPlayPause", this.audioElts);
        await this.playSegment();
        this.stopAudio(true);
      },
      async clickPlay() {
        let { audioPlaying, settings, audioScid } = this;
        if (!audioPlaying) {
          let { ips } = settings;
          let ipsChoice = EbtSettings.IPS_CHOICES.filter(c=>c.value===ips)[0];
          logger.info("SuttaPlayer.clickPlay()", {audioScid});

          this.audioUrls = [ URL_NOAUDIO, ipsChoice.url ];
          await new Promise(resolve=>nextTick(()=>resolve()));

          await this.playSegment();
        }

        this.stopAudio(true);
      },
      clickBack() {
        let { audioElts, routeCard, audioSegments:segments, audioPlaying } = this;
        if (audioPlaying) {
          audioElts.forEach(elt=>{
            if (elt) {
              elt.currentTime = 0;
            }
          });
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
        let { audioElts, routeCard, audioSegments:segments, audioPlaying } = this;
        this.stopAudio(true);
        let { location, iSegment } = routeCard.incrementLocation({
          segments,
          delta:1,
        });
        if (location) {
          window.location.hash = routeCard.routeHash();
        }
      },

      audioEnded(evt) {
        this.stopAudio(false);
      },
      audioEmptied(evt) {
        logger.info('SuttaPlayer.audioEmptied', {evt});
      },
      stopAudio(stopSegment) {
        let { audioElts } = this;
        logger.info("SuttaPlayer.stopAudio()");
        let stopped = !!this.audioPlaying;
        this.audioPlaying = AUDIO_INACTIVE;
        stopSegment && (this.segmentPlaying = false);
        audioElts.forEach(elt => {
          if (elt) {
            elt.pause();
            elt.currentTime = 0;
          }
        });
        if (this.audioResolve) {
          this.audioResolve();
          this.audioResolve = undefined;
        }
        return stopped;
      },
      async playSegment() {
        let { 
          audioElts, 
          audioScid, 
          routeCard, 
          audioSegments:segments, 
          settings, 
        } = this;
        logger.info("SuttaPlayer.playSegment()", audioScid);

        this.segmentPlaying = true;
        for (let i=0; this.segmentPlaying && i < audioElts.length; i++) {
          let audioElt = audioElts[i];
          if (audioElt) {
            await this.playAudio(audioElt, AUDIO_PLAY1);
            if (this.audioPlaying) {
              let { location, iSegment } = routeCard.incrementLocation({segments});
              if (location) {
                window.location.hash = routeCard.routeHash();
              }
              nextTick(() => { settings.scrollToCard(routeCard); })
              logger.debug("SuttaPlayer.playSegment() DONE");
            } else {
              logger.debug("SuttaPlayer.playSegment() PAUSE");
            }
          }
        }
        this.segmentPlaying = false;
      },
      async playAudio(audioElt, audioPlaying=AUDIO_PLAY1) {
        let that = this;
        let { audioSegments:segments, routeCard } = this;
        let { iSegment } = routeCard.incrementLocation({ segments, delta: 0, });

        if (!audioElt) {
          let msg = `SuttaPlayer.playAudio() audioElt?`;
          logger.warn(msg);
          throw new Error(msg);
        } 
        if (this.stopAudio()) {
          let msg = `SuttaPlayer.playAudio() stopAudio?`;
          logger.warn(msg);
          throw new Error(msg);
        }

        let res;
        logger.info("SuttaPlayer.playAudio()", {audioElt});
        try {
          await audioElt.play();
          await new Promise((resolve,reject)=>{
            if (that.audioResolve) {
              throw new Error(`SuttaPlayer.playAudio() audioResolve in progress`);
            }
            that.audioResolve = resolve;
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
          });
          logger.info("SuttaPlayer.playAudio() DONE");
        } catch(e) {
          alert(e.message);
        }
      }, // playAudio
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
  .audio-nav {
    padding-top: 2px;
    background: rgba(var(--v-theme-audiobar), 0.80);
  }
  .audio-nav:hover {
    background: rgba(var(--v-theme-audiobar), 1);
  }
</style>

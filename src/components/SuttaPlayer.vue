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
    <!--template v-for="(audioUrl,i) in audioUrls">
      <audio :ref="el => {audioElts[i] = el}" 
        @emptied = "audioEmptied"
        @ended = "audioEnded"
        preload=auto >
        <source type="audio/mp3" :src="audioUrl" />
        <p>{{ $t('ebt.noHTML5') }}</p>
      </audio>
    </template-->
    <audio :ref="el => {pliAudioElt = el}" 
      @emptied = "audioEmptied"
      @ended = "audioEnded"
      :src="pliAudioUrl"
      preload=auto >
      <source type="audio/mp3" :src="pliAudioUrl" />
      <p>{{ $t('ebt.noHTML5') }}</p>
    </audio>
    <audio :ref="el => {transAudioElt = el}" 
      @emptied = "audioEmptied"
      @ended = "audioEnded"
      :src="transAudioUrl"
      preload=auto >
      <source type="audio/mp3" :src="transAudioUrl" />
      <p>{{ $t('ebt.noHTML5') }}</p>
    </audio>
    <audio :ref="el => {bellAudioElt = el}" 
      @emptied = "audioEmptied"
      @ended = "audioEnded"
      preload=auto >
      <source type="audio/mp3" :src="bellUrl" />
      <p>{{ $t('ebt.noHTML5') }}</p>
    </audio>
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
        pliAudioElt: ref(undefined),
        pliAudioUrl: ref(URL_NOAUDIO),
        transAudioElt: ref(undefined),
        transAudioUrl: ref(URL_NOAUDIO),
        audioPlaying: ref(AUDIO_INACTIVE),
        progressDuration: ref(0),
        progressTime: ref(0),
        segmentPlaying: ref(false),
        bellAudioElt: ref(null),
        AUDIO_INACTIVE,
        AUDIO_PLAY1,
        AUDIO_PLAYALL,
      }
    },
    mounted() {
      logger.info("SuttaPlayer.mounted", this);
    },
    methods: {
      async playOne() {
        let { bellAudioElt, audioPlaying, audioScid } = this;

        logger.debug("SuttaPlayer.playOne() PLAY", audioScid);
        let completed = await this.playSegment(AUDIO_PLAY1);
        if (!completed) {
          logger.info("SuttaPlayer.playOne() INTERRUPTED");
        } else if (await this.clickNext()) {
          logger.info("SuttaPlayer.playOne() OK");
        } else {
          logger.info("SuttaPlayer.playOne() END");
          await this.playAudio(bellAudioElt, AUDIO_PLAY1);
        }
        this.stopAudio(true);
      },
      async clickPlayPause() {
        let { audioPlaying, audioScid } = this;

        if (audioPlaying) {
          logger.info("SuttaPlayer.clickPlayPause() PAUSE", audioScid);
          this.stopAudio(true);
        } else {
          this.playOne();
        } 
      },
      async playToEnd() {
        let { bellAudioElt, audioPlaying, audioScid } = this;

        logger.info("SuttaPlayer.playToEnd() PLAY", {audioScid});
        let completed = false;
        do {
          completed = await this.playSegment(AUDIO_PLAYALL);
        } while(completed && (await this.clickNext()));
        if (completed) {
          logger.info("SuttaPlayer.playToEnd() END");
          await this.playAudio(bellAudioElt, AUDIO_PLAY1);
        }
        this.stopAudio(true);
      },
      clickPlay() {
        let that = this;
        let { bellAudioElt, audioPlaying, audioScid } = this;

        if (audioPlaying) {
          logger.info("SuttaPlayer.clickPlay() PAUSE", {audioScid});
          this.stopAudio(true);
        } else {
          nextTick(()=>that.playToEnd());
        }
      },
      clickBack() {
        let { audioPlaying } = this;
        if (audioPlaying) {
          this.resetSegmentAudio();
        } else {
          this.incrementSegment(-1);
        }
      },
      async clickNext() {
        let { audioPlaying } = this;
        let incremented = false;
        if (audioPlaying) {
          this.stopAudio(true);
        } else {
          incremented = this.incrementSegment(1);
        }
        await new Promise(resolve=>nextTick(()=>resolve())); // sync instance

        return incremented;
      },

      resetSegmentAudio() {
        let { audioElts, audioPlaying } = this;
        audioElts.forEach(elt => {
          if (elt) {
            elt.currentTime = 0;
          }
        });
      },
      incrementSegment(delta) {
        let { routeCard, audioSegments:segments, } = this;
        let incRes = routeCard.incrementLocation({ segments, delta, });
        if (incRes == null) {
          return false; // at end
        }
        let { location, iSegment } = incRes;
        window.location.hash = routeCard.routeHash();

        return true; // incremented
      },
      audioEnded(evt) {
        this.stopAudio(false);
      },
      audioEmptied(evt) {
        logger.info('SuttaPlayer.audioEmptied', {evt});
      },
      stopAudio(stopSegment) {
        let { audioElts } = this;
        logger.debug(`SuttaPlayer.stopAudio()`, {stopSegment});
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
      async bindSegmentAudio() {
        let { volatile, settings, routeCard } = this;
        let { langTrans, vnameTrans, vnameRoot, serverUrl } = settings;
        let [ scid, lang, author ] = routeCard.location;
        let suttaRef = SuttaRef.create(scid, langTrans);
        let { sutta_uid, segnum } = suttaRef;

        let url = [ 
          serverUrl, 
          'play', 
          'segment', 
          sutta_uid,
          lang,
          author,
          encodeURIComponent(scid), 
          vnameTrans,
        ].join('/'); 

        let playJson = await volatile.fetchJson(url);
        let { audio } = playJson.segment;

        let audioUrls = [];
        if (settings.showPali) {
          this.pliAudioUrl = [
            serverUrl,
            'audio',
            sutta_uid,
            'pli',
            author,
            vnameRoot,
            audio.pli,
          ].join('/');
          audioUrls.push(this.pliiAudioUrl);
        }
        if (settings.showTrans) {
          this.transAudioUrl = [
            serverUrl,
            'audio',
            sutta_uid,
            lang,
            author,
            vnameTrans,
            audio[lang],
          ].join('/');
          audioUrls.push(this.tansAudioUrl);
        }
        logger.info("SuttaPlay.bindSegmentAudio()", audioUrls);

        return audioUrls;
      },
      async playSegment(audioPlaying=AUDIO_PLAY1) {
        let { 
          audioElts, 
          routeCard, 
          audioSegments:segments, 
          settings, 
          volatile,
          bellAudioElt,
          pliAudioElt,
          transAudioElt,
        } = this;
        let audioScid = routeCard.location[0]; // avoid Vue sync lag

        let audioUrls = await this.bindSegmentAudio();

        // TODO
        this.audioUrls = audioUrls;

        logger.info(`SuttaPlayer.playSegment() ${audioScid}`);

        this.segmentPlaying = true;
        //for (let i=0; this.segmentPlaying && i < audioElts.length; i++) {
          //let audioElt = audioElts[i];
          //if (audioElt) {
            //await this.playAudio(audioElt, audioPlaying);
          //}
        //}
        if (this.segmentPlaying && settings.showPali) {
          await this.playAudio(pliAudioElt, audioPlaying);
        }

        if (this.segmentPlaying && settings.showTrans) {
          await this.playAudio(transAudioElt, audioPlaying);
        }

        if (!this.segmentPlaying) {
          return false; // interrupted
        }

        this.segmentPlaying = false;
        return true; // completed
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
        logger.debug("SuttaPlayer.playAudio()", {audioElt});
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
              : segments.length-1;
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
          logger.debug("SuttaPlayer.playAudio() DONE");
        } catch(e) {
          alert(e.message);
        }
      }, // playAudio
    },
    computed: {
      bellUrl(ctx) {
        let { ips } = ctx.settings;
        let ipsChoice = EbtSettings.IPS_CHOICES.filter(c=>c.value===ips)[0];
        return ipsChoice?.url;
      },
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

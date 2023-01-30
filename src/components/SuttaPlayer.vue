<template>
  <v-bottom-navigation v-if="audioScid" 
    hide-on-scroll
    dense
    dark
    bg-color="audiobar"
    class="audio-nav"
  >
    <div class="play-col">
      <v-progress-linear 
        :model-value="segmentPercent"
        :buffer-value="100"
        color="progress1" 
        bg-color="progress2"
        height="2px" />
      <div class="play-row">
        <v-btn icon @click="clickBack" density="compact" tabindex=-1>
          <v-icon size="small" icon="mdi-skip-previous" />
        </v-btn>
        <v-btn id="audio-play-pause" icon density="compact"
          @keydown="audioKey"
          @click="clickPlayPause" 
          @blur="onAudioBlur"
          @focus="onAudioFocus('audio-play-pause')"
        >
          <v-icon size="small" :icon="audioPlaying ? 'mdi-pause' : 'mdi-play-pause'" />
        </v-btn>
        <div class="play-scid" >
          <div @click="onClickPlayScid">
            {{audioScid}}
          </div>
          <div v-if="audioPlaying" class="audioElapsed">
            {{ audioElapsed.toFixed(1) }} / 
            {{ audioDuration.toFixed(1) }}
          </div>
        </div>
        <v-btn id="audio-play-to-end"
          icon density="compact"
          @click="clickPlay" 
          @keydown="audioKey"
          @blur="onAudioBlur"
          @focus="onAudioFocus('audio-play-to-end')"
        >
          <v-icon size="small" :icon="audioPlaying ? 'mdi-pause' : 'mdi-play'" />
        </v-btn>
        <v-btn icon @click="clickNext" density="compact" tabindex=-1>
          <v-icon size="small" icon="mdi-skip-next" />
        </v-btn>
      </div><!-- play-row -->
    </div><!-- play-col -->
  </v-bottom-navigation>
</template>

<script>
  import { ref, nextTick } from "vue";
  import { Examples, SuttaRef } from 'scv-esm';
  import { default as IdbSutta } from '../idb-sutta.mjs';
  import { default as EbtSettings } from "../ebt-settings.mjs";
  import { default as EbtCard } from '../ebt-card.mjs';
  import { default as IdbAudio } from '../idb-audio.mjs';
  import { useSuttasStore } from '../stores/suttas.mjs';
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useVolatileStore } from '../stores/volatile.mjs';
  import { useAudioStore } from '../stores/audio.mjs';
  import { logger } from "log-instance";
  const EXAMPLE_TEMPLATE = IdbSutta.EXAMPLE_TEMPLATE;

  // TODO: Apple doesn't support AudioContext symbol
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const SAMPLE_RATE = 48000;

  const URL_NOAUDIO = "audio/383542__alixgaus__turn-page.mp3";
  const PAT_NOAUDIO = ['ac87a767581710d97b8bf190fd5e109c']; // Amy
  const LENGTH_NOAUDIO = 5000; // actually 3761
  const AUDIO_INACTIVE = 0;
  const AUDIO_PLAY1 = 1;
  const AUDIO_PLAYALL = 2;

  export default {
    props: {
      routeCard: { type: Object, },
    },
    setup() {
      return {
        audio: useAudioStore(),
        suttas: useSuttasStore(),
        settings: useSettingsStore(),
        volatile: useVolatileStore(),
        audioContext: ref(undefined),
        audioFocus: 'audio-play-pause',
        idbAudio: ref(undefined),
        pliAudioUrl: ref(URL_NOAUDIO),
        transAudioUrl: ref(URL_NOAUDIO),
        audioElapsed: ref(undefined),
        segmentPlaying: ref(false),
        AUDIO_INACTIVE,
        AUDIO_PLAY1,
        AUDIO_PLAYALL,
      }
    },
    updated() {
      this.setAudioFocus();
    },
    methods: {
      onAudioBlur() {
        let { audio } = this;
        audio.audioFocused = false;
      },
      onAudioFocus(audioFocus) {
        let { audio, } = this;
        this.audioFocus = audioFocus;
        audio.audioFocused = true;
      },
      setAudioFocus() {
        let { audioFocus } = this;
        let elt = document.getElementById(audioFocus);
        elt?.focus();
        logger.debug("SuttaPlayer.setAudioFocus() audioFocus", elt);
      },
      audioKey(evt) {
        if (evt.code === "ArrowDown") {
          this.incrementSegment(1);
          evt.preventDefault();
        } else if (evt.code === "ArrowUp") {
          this.incrementSegment(-1);
          evt.preventDefault();
        }
      },
      async playOne() {
        let { audio, audioScid } = this;

        logger.debug("SuttaPlayer.playOne() PLAY", audioScid);
        let completed = await this.playSegment(AUDIO_PLAY1);
        if (!completed) {
          // interrupted
        } else if (await this.next()) {
          logger.debug("SuttaPlayer.playOne() OK");
        } else {
          logger.debug("SuttaPlayer.playOne() END");
          audio.playBell();
        }
        this.stopAudio(true);
      },
      createIdbAudio() {
        // NOTE: Caller must UI callback (iOS restriction)
        let { audio } = this;
        let audioContext =  this.audioContext = audio.getAudioContext();
        let idbAudio = this.idbAudio = new IdbAudio({audioContext});
        return idbAudio;
      },
      playPause() {
        let { audio, audioContext, idbAudio } = this;
        audio.playClick();

        if (idbAudio?.audioSource) {
          if (idbAudio.paused) {
            idbAudio.play();
          } else {
            idbAudio.pause();
          }
          return true;
        }

        audioContext && audioContext.close();
        this.audioContext = audioContext = audio.getAudioContext();
        return false;
      },
      clickPlayPause() {
        let msg = 'SuttaPlayer.clickPlayPause() ';
        let { audio } = this;

        if (this.playPause()) {
          logger.debug(msg + 'toggled');
          return;
        }

        logger.debug(msg + 'playing');
        this.idbAudio = this.createIdbAudio();
        this.playOne();
      },
      async playToEnd() {
        let { audio, audioScid } = this;

        logger.debug("SuttaPlayer.playToEnd() PLAY", {audioScid});
        let completed = false;
        audio.playClick();
        do {
          completed = await this.playSegment(AUDIO_PLAYALL);
        } while(completed && (await this.next()));
        if (completed) {
          logger.debug("SuttaPlayer.playToEnd() END");
          await audio.playBell();
        }
        this.stopAudio(true);
      },
      clickPlay() {
        let msg = 'SuttaPlayer.clickPlay() ';
        let { audio } = this;

        if (this.playPause()) {
          logger.debug(msg + 'toggled');
          return;
        }

        logger.debug(msg + 'playing');
        this.idbAudio = this.createIdbAudio();
        this.playToEnd();
      },
      async back() {
        this.incrementSegment(-1);
      },
      clickBack() {
        let { audio } = this;
        audio.playClick();
        return this.back();
      },
      async next() {
        let { audioPlaying, } = this;
        let incremented = false;
        //if (audioPlaying) {
          //this.stopAudio(true);
        //} else {
          let incRes = this.incrementSegment(1);
          if (incRes) {
            let { iSegment } = incRes;
            incremented = true;
          } else {
            logger.debug("SuttaPlayer.next() END");
          }
        //}
        await new Promise(resolve=>nextTick(()=>resolve())); // sync instance

        return incremented;
      },
      clickNext() {
        let { audio } = this;
        audio.playClick();
        return this.next();
      },
      onClickPlayScid() {
        let { routeCard, settings, } = this;
        let eltId = routeCard.routeHash();
        settings.scrollToElementId(eltId);
        this.setAudioFocus();
      },
      incrementSegment(delta) {
        let { settings, routeCard, audioSutta, } = this;
        let { segments } = audioSutta;
        let incRes = routeCard.incrementLocation({ segments, delta, });
        if (incRes) {
          let { iSegment } = incRes;
          let seg = segments[iSegment];
          settings.setRoute(routeCard.routeHash());
        }

        return incRes;
      },
      audioEnded(evt) {
        this.stopAudio(false);
        logger.debug('SuttaPlayer.audioEnded', {evt});
      },
      stopAudio(stopSegment) {
        logger.debug(`SuttaPlayer.stopAudio()`, {stopSegment});
        let stopped = false;
        stopSegment && (this.segmentPlaying = false);
        if (this.audioResolve) {
          this.audioResolve();
          this.audioResolve = undefined;
        }
        return stopped;
      },
      async bindSegmentAudio() {
        const msg = 'SuttaPlayer.bindSegmentAudio() ';
        let { $t, volatile, settings, routeCard, audio } = this;
        let { langTrans, vnameTrans, vnameRoot, serverUrl } = settings;
        let [ scid, lang, author ] = routeCard.location;
        let suttaRef = SuttaRef.create(scid, langTrans);
        let { sutta_uid, segnum } = suttaRef;
        let result;
        try {
          volatile.waitBegin($t('ebt.loadingAudio'));

          let segAudio = await audio.getSegmentAudio(suttaRef);
          let { segment } = segAudio;

          if (settings.speakPali) {
            if (segment.pli) {
              this.pliAudioUrl = [
                serverUrl,
                'audio',
                sutta_uid,
                'pli',
                author,
                vnameRoot,
                segment.audio.pli,
              ].join('/');
            } else {
              this.pliAudioUrl = URL_NOAUDIO;
            }
          }
          if (settings.speakTranslation) {
            let langText = segment[lang];
            if (langText) {
              this.transAudioUrl = [
                serverUrl,
                'audio',
                sutta_uid,
                lang,
                author,
                vnameTrans,
                segment.audio[lang],
              ].join('/');
            } else {
              this.transAudioUrl = URL_NOAUDIO;
            }
          }
          logger.debug(msg + segment.scid);
          result = segAudio;
        } finally {
          volatile.waitEnd();
        }
        return result;
      },
      async playSegment() {
        const msg = `SuttaPlayer.playSegment() `;
        let segAudio = await this.bindSegmentAudio();
        let { segment:seg, langTrans } = segAudio;
        let { 
          audio,
          audioContext,
          routeCard, 
          audioScid,
          settings, 
          idbAudio,
        } = this;
        let that = this;
        const IDB_AUDIO = 1;

        logger.debug(`${msg} ${audioScid}`);

        let interval;
        try {
          this.audioElapsed = -2;
          interval = setInterval( ()=>{
            let currentTime = this.idbAudio?.currentTime || -1;
            this.audioElapsed = currentTime/1000;
            if (this.audioScid !== audioScid) {
              clearInterval(interval);
              logger.info(msg + `interrupt`, 
                `${audioScid}=>${this.audioScid}`);
              this.segmentPlaying = false;
              idbAudio.clear();
            }
          }, 100);
          this.segmentPlaying = true;

          let idOrRef = audioScid;
          if (this.segmentPlaying && settings.speakPali && seg.pli) {
            let src = await audio.langAudioUrl({idOrRef, lang:'pli', segAudio});
            idbAudio.src = src;
            logger.debug(`${msg} pliUrl:`, src);
            await idbAudio.play();
          }

          if (this.segmentPlaying && settings.speakTranslation && seg[langTrans]) {
            let lang = settings.langTrans;
            let src = await audio.langAudioUrl({idOrRef, lang, segAudio});
            idbAudio.src = src;
            logger.debug(`${msg} transUrl:`, src);
            await idbAudio.play();
          }
          clearInterval(interval);
          interval = undefined;
        } catch(e) {
          clearInterval(interval);
          interval = undefined;
          logger.warn(msg, e);
        } finally {
          this.audioElapsed = -1;
        }

        logger.debug(`${msg} segmentPlaying`, this.segmentPlaying);

        if (!this.segmentPlaying) {
          return false; // interrupted
        }

        this.segmentPlaying = false;
        return true; // completed
      },
    },
    computed: {
      audioDuration(ctx) {
        return ctx.idbAudio?.audioBuffer?.duration || 0;
      },
      audioPlaying(ctx) {
        return !!ctx.idbAudio?.audioSource;
      },
      audioScid(ctx) {
        return ctx.audio.audioScid;
      },
      audioSutta(ctx) {
        return ctx.audio.audioSutta;
      },
      segmentPercent(ctx) {
        let { audio, audioSutta } = ctx;
        let { audioIndex } = audio;
        return (audioIndex+1)*100 / audioSutta.segments.length+1;
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
    cursor: pointer;
    display: flex;
    flex-flow: column;
    align-items: center;
    font-family: var(--ebt-sc-sans-font);
    font-size: larger;
    font-weight: 600;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
  .audioElapsed {
    font-weight: 400;
  }
  .audio-nav {
    padding-top: 2px;
    opacity: 1;
  }
</style>

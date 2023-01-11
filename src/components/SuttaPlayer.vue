<template>
  <v-bottom-navigation v-if="audioScid" 
    hide-on-scroll
    dense
    dark
    bg-color="audiobar"
    class="audio-nav"
  >
    {{audio.audioFocus}}
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
        <v-btn id="audio-focus" icon density="compact"
          @keydown="audioKey"
          @click="clickPlayPause" 
          @blur="onAudioBlur"
          @focus="onAudioFocus"
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
        <v-btn icon density="compact"
          @click="clickPlay" 
          @keydown="audioKey"
          @blur="onAudioBlur"
          @focus="onAudioFocus"
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
        pliAudioUrl: ref(URL_NOAUDIO),
        transAudioUrl: ref(URL_NOAUDIO),
        audioPlaying: ref(AUDIO_INACTIVE),
        audioDuration: ref(0),
        audioElapsed: ref(0),
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
      onAudioFocus() {
        let { audio, } = this;
        audio.audioFocused = true;
      },
      setAudioFocus() {
        let { audioScid } = this;
        let audioFocus = document.getElementById('audio-focus');
        audioFocus?.focus();
        logger.debug("SuttaPlayer.setAudioFocus() audioFocus", audioFocus);
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
        let { audio, audioPlaying, audioScid } = this;

        logger.debug("SuttaPlayer.playOne() PLAY", audioScid);
        let completed = await this.playSegment(AUDIO_PLAY1);
        if (!completed) {
          // interrupted
        } else if (await this.next()) {
          logger.info("SuttaPlayer.playOne() OK");
        } else {
          logger.info("SuttaPlayer.playOne() END");
          audio.playBell();
        }
        this.stopAudio(true);
      },
      clickPlayPause() {
        let { audio, audioScid, audioPlaying, audioContext, } = this;

        if (audioContext == null) {
          this.audioContext = audioContext = audio.getAudioContext();
        }

        audio.playClick();

        if (audioPlaying) {
          logger.info("SuttaPlayer.clickPlayPause() PAUSE", audioScid);
          this.stopAudio(true);
        } else {
          this.playOne();
        } 
      },
      async playToEnd() {
        let { audio, audioPlaying, audioScid } = this;

        logger.info("SuttaPlayer.playToEnd() PLAY", {audioScid});
        let completed = false;
        audio.playClick();
        do {
          completed = await this.playSegment(AUDIO_PLAYALL);
        } while(completed && (await this.next()));
        if (completed) {
          logger.info("SuttaPlayer.playToEnd() END");
          await audio.playBell();
        }
        this.stopAudio(true);
      },
      clickPlay() {
        let that = this;
        let { audioPlaying, audioScid } = this;

        if (audioPlaying) {
          logger.info("SuttaPlayer.clickPlay() PAUSE", {audioScid});
          this.stopAudio(true);
        } else {
          nextTick(()=>that.playToEnd());
        }
      },
      async back() {
        let { audioPlaying } = this;
        if (audioPlaying) {
          this.incrementSegment(-1);
        }
      },
      clickBack() {
        let { audio } = this;
        audio.playClick();
        return this.back();
      },
      async next() {
        let { audioPlaying, } = this;
        let incremented = false;
        if (audioPlaying) {
          this.stopAudio(true);
        } else {
          let incRes = this.incrementSegment(1);
          if (incRes) {
            let { iSegment } = incRes;
            incremented = true;
          } else {
            logger.info("SuttaPlayer.next() END");
          }
        }
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
        this.audioPlaying = AUDIO_INACTIVE;
        this.audioElapsed = 0;
        stopSegment && (this.segmentPlaying = false);
        if (this.audioResolve) {
          this.audioResolve();
          this.audioResolve = undefined;
        }
        return stopped;
      },
      async bindSegmentAudio() {
        let { $t, volatile, settings, routeCard } = this;
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

        try {
          volatile.waitBegin($t('ebt.loadingAudio'));

          let playJson = await volatile.fetchJson(url);
          let { segment } = playJson;

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
          logger.debug("SuttaPlay.bindSegmentAudio()");
        } finally {
          volatile.waitEnd();
        }
      },
      async playSegment(audioPlaying=AUDIO_PLAY1) {
        let { 
          audio,
          audioContext,
          routeCard, 
          audioScid,
          settings, 
        } = this;
        await this.bindSegmentAudio();
        const IDB_AUDIO = 1;

        logger.debug(`SuttaPlayer.playSegment() ${audioScid}`);

        this.segmentPlaying = true;
        if (this.segmentPlaying && settings.speakPali) {
          let src = await audio.langAudioUrl(audioScid, 'pli');
          let idbAudio = new IdbAudio({audioContext, src});
          await idbAudio.play();
        }

        if (this.segmentPlaying && settings.speakTranslation) {
          let src = await audio.langAudioUrl(audioScid, settings.langTrans);
          let idbAudio = new IdbAudio({audioContext, src});
          await idbAudio.play();
        }

        if (!this.segmentPlaying) {
          return false; // interrupted
        }

        this.segmentPlaying = false;
        return true; // completed
      },
    },
    computed: {
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

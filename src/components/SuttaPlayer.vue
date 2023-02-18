<template>
  <v-bottom-navigation v-if="audio.audioScid" 
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
          <v-icon size="small" 
            :icon="audio.idbAudio?.isPlaying ? 'mdi-pause' : 'mdi-play-pause'" />
        </v-btn>
        <div class="play-scid" >
          <div @click="onClickPlayScid">
            {{audio.audioScid}}
          </div>
          <div v-if="audioDuration" class="audioElapsed">
            {{ audioElapsed }} / {{ audioDuration }}
          </div>
        </div>
        <v-btn id="audio-play-to-end"
          icon density="compact"
          @click="clickPlayToEnd" 
          @keydown="audioKey"
          @blur="onAudioBlur"
          @focus="onAudioFocus('audio-play-to-end')"
        >
          <v-icon size="small" 
            :icon="audio.idbAudio?.isPlaying ? 'mdi-pause' : 'mdi-play'" />
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

  export default {
    props: {
      routeCard: { type: Object, },
    },
    setup() {
      return {
        audio: useAudioStore(),
        settings: useSettingsStore(),
        volatile: useVolatileStore(),
      }
    },
    methods: {
      onAudioBlur() {
        let { audio } = this;
        audio.audioFocused = false;
      },
      onAudioFocus(audioFocus) {
        let { audio, } = this;
        audio.audioFocused = true;
      },
      audioKey(evt) {
        let { audio } = this;
        if (evt.code === "ArrowDown") {
          audio.incrementSegment(1);
          evt.preventDefault();
        } else if (evt.code === "ArrowUp") {
          audio.incrementSegment(-1);
          evt.preventDefault();
        }
      },
      async playOne() {
        let { audio, } = this;

        logger.debug("SuttaPlayer.playOne() PLAY", audio.audioScid);
        let completed = await audio.playSegment();
        if (!completed) {
          // interrupted
        } else if (await this.next()) {
          logger.debug("SuttaPlayer.playOne() OK");
        } else {
          logger.debug("SuttaPlayer.playOne() END");
          audio.playBell();
        }
      },
      playPause() {
        let { audio, } = this;
        let { idbAudio } = audio;
        let { mainContext:audioContext } = audio;
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
        audio.audioContext = audioContext = audio.getAudioContext();
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
        audio.createIdbAudio();
        this.playOne();
      },
      async playToEnd() {
        let { audio, } = this;

        logger.info("SuttaPlayer.playToEnd() PLAY", audio.audioScid);
        let completed;
        do {
          completed = await audio.playSegment();
        } while(completed && (await this.next()));
        if (completed) {
          logger.info("SuttaPlayer.playToEnd() END");
          await audio.playBell();
        }
      },
      clickPlayToEnd() {
        let msg = 'SuttaPlayer.clickPlayToEnd() ';
        let { audio } = this;

        if (this.playPause()) {
          logger.debug(msg + 'toggled');
          return;
        }

        logger.info(msg + 'playing');
        audio.createIdbAudio();
        this.playToEnd();
      },
      async back() {
        let { audio } = this;
        audio.incrementSegment(-1);
      },
      clickBack() {
        let { audio } = this;
        audio.playClick();
        return this.back();
      },
      async next() {
        let { audio } = this;
        let incremented = false;
        let incRes = audio.incrementSegment(1);
        if (incRes) {
          let { iSegment } = incRes;
          incremented = true;
        } else {
          logger.debug("SuttaPlayer.next() END");
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
      },
      audioPlaying() {
        let { audio } = this;
        let { idbAudio, mainContext } = audio;
        return !!idbAudio?.audioSource && 
          audio?.mainContext?.state === 'running';
      },
      isRunning() {
        return this.audio.mainContext?.state === 'running';
      },
    },
    computed: {
      audioElapsed(ctx) {
        let elapsed = ctx.audio.audioElapsed;
        return elapsed.toFixed(1);
      },
      audioDuration(ctx) {
        let duration = ctx.audio.audioDuration();
        return typeof duration === 'number' ? duration.toFixed(1) : null
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

import { logger } from 'log-instance';
import { useVolatileStore } from './stores/volatile.mjs';
import { useAudioStore } from './stores/audio.mjs';

const HEADERS_MPEG = { ["Accept"]: "audio/mpeg", };
const URL_NO_AUDIO = "https://github.com/ebt-site/ebt-vue3/blob/04a335368ebd751d1caf56312d6599f367eaa21f/public/audio/no_audio.mp3";

export default class IdbAudio {
  #src;
  #arrayBuffer;

  constructor(opts={}) {
    if (typeof(opts) === 'string') {
      opts = { src: opts };
    }
    let {
      src=URL_NO_AUDIO,
      audioContext,
    } = opts;
    if (audioContext == null) {
      audioContext = new AudioContext();
      audioContext.resume(); // for iOS
    }
    this.#src = src;
    Object.assign(this, {
      audioContext,
      msStart: null,
      msPlay: 0,
    });
  }

  static get URL_NO_AUDIO() { return URL_NO_AUDIO; }

  get src() {
    return this.#src;
  }

  get currentSrc() {
    return this.#src;
  }

  get currentTime() {
    let { msStart, msPlay } = this;
    if (msStart == null) {
      return msPlay;
    }

    let msElapsed = Date.now() - msStart;
    return msPlay + msElapsed;
  }

  set currentTime(value) {
    if (value !== 0) {
      let msg = `IdbAudio.currentTime(${value}) expected zero`;
      logger.warn(msg);
      console.trace(msg);
      throw new Error(msg);
    }
    this.msPlay = 0;
  }

  get paused() {
    let { audioContext } = this;
    return audioContext.state === 'suspended';
  }

  pause() {
    let { audioContext, msStart, msPlay } = this;
    switch(audioContext.state) {
      case 'running':
        audioContext.suspend();
        if (msStart != null) { // playing
          let msElapsed = Date.now() - msStart;
          this.msPlay = msPlay + msElapsed;
          this.msStart = null;
        }
        break;
      case 'suspended':
      case 'closed':
      default:
        // no action required
        break;
    }
  }

  async play() {
    try {
      const audio = useAudioStore();
      let { audioContext, src, msStart } = this;
      let msg = 'IdbAudio.play() ';

      switch (audioContext.state) {
        case 'suspended':
          audioContext.resume();
          break;
        case 'running':
          // no action required
          break;
        case 'closed': 
          msg += `audioContext is closed`;
          logger.warn(msg);
          console.trace(msg);
          throw new DOMException(msg, INVALID_STATE_ERROR);
        default:
          msg += `unknown state:${audioContext.state}`;
          logger.warn(msg);
          console.trace(msg);
          throw new DOMException(msg, INVALID_STATE_ERROR);
      }

      this.msStart = Date.now(); // temporarily use fetch time as playing time
      this.#arrayBuffer = await audio.fetchAudioBuffer(src);
      this.msStart = Date.now(); // actual playing time

      //let audioSource = audioContext.createBufferSource();

      return this.#arrayBuffer; // implementation dependent
    } catch (e) {
      logger.warn("IdbAudio.play()", e.message);
      console.trace("ERROR", e.message);
      return null;
    }
  }

  static get URL_NO_AUDIO() {
    return URL_NO_AUDIO;
  }
}



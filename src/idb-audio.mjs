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
      ended: ()=>{
        console.log("IdbAudio.ended()");
      },
    });
  }

  static get URL_NO_AUDIO() { return URL_NO_AUDIO; }

  get duration() {
    return 0;
  }

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
    console.log("DBG0107 IdbAudio.pause() audioContext", audioContext.state);
    switch(audioContext.state) {
      case 'running':
        audioContext.suspend();
        if (msStart != null) { // playing
          msPlay += Date.now() - msStart;
          logger.debug("IdbAudio.pause() msStart");
          this.msPlay = msPlay;
          this.msStart = null;
        } else {
          logger.debug("IdbAudio.pause() !msStart");
        }
        break;
      case 'suspended':
      case 'closed':
      default:
        // no action required
        break;
    }
  }

  async createAudioSource() {
    const audio = useAudioStore();
    let { audioContext, src } = this;
    let that = this;
    let msgPrefix = 'IdbAudio.createAudioSource()';

    this.msStart = Date.now(); // temporarily use fetch time as playing time
    let arrayBuffer = await audio.fetchAudioBuffer(src);
    this.#arrayBuffer = arrayBuffer;

    let audioSource = audioContext.createBufferSource();
    let promise = new Promise((resolve, reject) => { try {
      console.log(`DBG0107 ${msgPrefix} onended...`, this.src);
      audioSource.onended = evt => {
        console.log(`DBG0107 ${msgPrefix} => onended`, this.src);
        if (that.ended) {
          let evt = new Event('idb-audio');
          that.ended(evt)
        }
        resolve(); 
      };
    } catch(e) {
      volatile.alert(e, 'ebt.audioError');
      reject(e);
    }}); // Promise

    this.msStart = Date.now(); // actual playing time
    console.log(`${msgPrefix} DBG0`, this.currentTime);
    audioSource.start();
    return audioSource;
  }

  async play() {
    try {
      let { audioContext, src, msStart } = this;
      const audio = useAudioStore();
      let msgPrefix = 'IdbAudio.play()';

      switch (audioContext.state) {
        case 'suspended':
          audioContext.resume();
          this.msStart = Date.now(); // activate currentTime
          return;
        case 'running': {
          let audioSource = await this.createAudioSource();
          break;
        }
        case 'closed': {
          let msg = `${msgPrefix} audioContext is closed`;
          logger.warn(msg);
          console.trace(msg);
          throw new DOMException(msg, INVALID_STATE_ERROR);
        }
        default: {
          let msg = `${msgPrefix} unknown state:${audioContext.state}`;
          logger.warn(msg);
          console.trace(msg);
          throw new DOMException(msg, INVALID_STATE_ERROR);
        }
      }

    } catch (e) {
      logger.warn("IdbAudio.play()", e.message);
      console.trace("ERROR", e.message);
      return null;
    }

    return this.#arrayBuffer;
  }

  static get URL_NO_AUDIO() {
    return URL_NO_AUDIO;
  }
}



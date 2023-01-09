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
      preload=false,
    } = opts;
    if (audioContext == null) {
      audioContext = new AudioContext();
      audioContext.resume(); // for iOS
    }
    Object.assign(this, {
      audio: useAudioStore(),
      preload,
      audioContext,
      msStart: null,
      msPlay: 0,
      ended: ()=>{
        console.log("IdbAudio.ended()");
      },
    });
    this.src = src;
  }

  static get URL_NO_AUDIO() { return URL_NO_AUDIO; }

  get duration() {
    let { audioBuffer } = this;
    return audioBuffer?.duration || 0;
  }

  get src() {
    return this.#src;
  }

  set src(value) {
    const msgPrefix = "IdbAudio.src.set()";
    let that = this;
    let { preload } = this;
    this.#src = value;
    return preload && value
      ? new Promise((resolve,reject)=>{
          console.log(`${msgPrefix} preload`, value);
          that.fetchAudioBuffer(value).then(()=>{
            console.log(`${msgPrefix} preload OK`);
            resolve(value);
          }).catch(e=>reject(e));
        })
      : value;
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
          msPlay += Date.now() - msStart;
          logger.debug("IdbAudio.pause() msStart");
          this.msPlay = msPlay;
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
    this.msStart = null;
    console.log("DBG0107 IdbAudio.pause() audioContext", audioContext.state);
  }

  async fetchAudioBuffer() {
    const msgPrefix = 'IdbAudio.fetchAudioBuffer()';
    try {
      let { audioContext, audio, src } = this;
      this.msStart = Date.now(); // temporarily use fetch time as playing time
      let arrayBuffer = await audio.fetchArrayBuffer(src);
      this.#arrayBuffer = arrayBuffer;
      let audioBuffer = await audio.createAudioBuffer({audioContext, arrayBuffer});
      this.audioBuffer = audioBuffer;
      return audioBuffer;
    } catch(e) {
      let msg = `${msgPrefix} ERROR ${e.message}`;
      logger.warn(msg);
      console.trace(msg,e);
    }
  }

  async play() {
    const msgPrefix = 'IdbAudio.play()';
    try {
      let { audioContext, src, msStart, audio } = this;

      switch (audioContext.state) {
        case 'suspended':
          audioContext.resume();
          this.msStart = Date.now(); // activate currentTime
          console.log(`DBG0109 ${msgPrefix} resume()`);
          return;
        case 'running': {
          let audioBuffer = this.audioBuffer || (await this.fetchAudioBuffer());
          if (msStart == null) { // paused
            this.msStart = Date.now(); // actual playing time
          }
          console.log(`DBG0108 ${msgPrefix} duration`, audioBuffer.duration);
          let audioSource = await audio.createAudioSource({audioContext, audioBuffer});
          console.log(`DBG0108 ${msgPrefix} audioSource created`);
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



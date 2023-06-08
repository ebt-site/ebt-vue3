import { logger } from 'log-instance/index.mjs';
import { useVolatileStore } from './stores/volatile.mjs';
import { useAudioStore } from './stores/audio.mjs';

const HEADERS_MPEG = { ["Accept"]: "audio/mpeg", };
const URL_NO_AUDIO = "https://github.com/ebt-site/ebt-vue3/blob/04a335368ebd751d1caf56312d6599f367eaa21f/public/audio/no_audio.mp3";

export default class IdbAudio {
  constructor(opts={}) {
    if (typeof(opts) === 'string') {
      opts = { src: opts };
    }
    let {
      src=URL_NO_AUDIO,
      audioContext,
      preload=false,
      created=Date.now(),
    } = opts;
    if (audioContext == null) {
      audioContext = new AudioContext();
      audioContext.resume(); // for iOS
    }
    Object.assign(this, {
      audioBuffer: null,
      audioContext,
      audioSource: null,
      audio: useAudioStore(),
      created,
      ended: ()=>{ console.log("IdbAudio.ended()"); },
      msPlay: 0,
      msStart: null,
      preload,
    });
    this.src = src;
  }

  static get URL_NO_AUDIO() { return URL_NO_AUDIO; }

  get src() {
    return this.currentSrc;
  }

  set src(value) {
    var msg = `IdbAudio.src.set() ${value} `;
    let { preload } = this;

    if (this.currentSrc !== value) {
      this.currentSrc = value;
      this.clear();
      if (preload) {
        let promise = this.fetchAudioBuffer();
        promise.then(()=>{
          msg += `fetchAudioBuffer() OK`;
          logger.info(msg);
        }).catch(e=>{
          msg += e.message;
          logger.warn(msg);
          console.trace(e);
        });
      }
    }
    return this;
  }

  get duration() {
    let { audioBuffer } = this;
    return audioBuffer?.duration || 0;
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
    let { audioContext, audioSource } = this;
    return audioContext.state === 'suspended';
  }

  get isPlaying() {
    let { audioContext, audioBuffer } = this;
    return audioContext?.state === 'running' &&
      audioBuffer != null;
  }

  clear() {
    this.audioSource?.disconnect && this.audioSource.disconnect();
    this.audioSource?.stop && this.audioSource.stop();
    this.audioSource = null;
    this.audioBuffer = null;
    this.msStart = null;
    this.msPlay = 0;
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
  }

  async fetchAudioBuffer() {
    const msgPfx = 'IdbAudio.fetchAudioBuffer()';
    try {
      let { audioContext, audio, src } = this;
      this.msStart = Date.now(); // temporarily use fetch time as playing time
      let arrayBuffer = await audio.fetchArrayBuffer(src);
      this.arrayBuffer = arrayBuffer;
      let audioBuffer = await audio.createAudioBuffer({audioContext, arrayBuffer});
      this.audioBuffer = audioBuffer;
      return audioBuffer;
    } catch(e) {
      let msg = `${msgPfx} ERROR ${e.message}`;
      logger.warn(msg);
      console.trace(msg,e);
    }
  }

  async play() {
    const msgPfx = 'IdbAudio.play()';
    try {
      let { audioContext, src, msStart, audio } = this;

      switch (audioContext.state) {
        case 'suspended':
          audioContext.resume();
          this.msStart = Date.now(); // activate currentTime
          return;
        case 'running': {
          if (this.audioBuffer == null) {
            this.audioBuffer = this.fetchAudioBuffer();
          }
          if (this.audioBuffer instanceof Promise) {
            this.audioBuffer = await this.audioBuffer;
          }
          let audioBuffer = this.audioBuffer;
          if (msStart == null) { // paused
            this.msStart = Date.now(); // actual playing time
          }
          let audioSource = await audio.createAudioSource({audioContext, audioBuffer});
          this.audioSource = audioSource;
          await audio.playAudioSource({audioContext, audioSource});
          this.audioSource = null;
          this.audioBuffer = null;
          break;
        }
        case 'closed': {
          let msg = `${msgPfx} audioContext is closed`;
          logger.warn(msg);
          console.trace(msg);
          throw new DOMException(msg, INVALID_STATE_ERROR);
        }
        default: {
          let msg = `${msgPfx} unknown state:${audioContext.state}`;
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

    return this.arrayBuffer;
  }

  static get URL_NO_AUDIO() {
    return URL_NO_AUDIO;
  }
}



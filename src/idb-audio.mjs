import { logger } from 'log-instance';
import { useVolatileStore } from './stores/volatile.mjs';
import { useAudioStore } from './stores/audio.mjs';

const HEADERS_MPEG = { ["Accept"]: "audio/mpeg", };
const URL_NO_AUDIO = "https://github.com/ebt-site/ebt-vue3/blob/04a335368ebd751d1caf56312d6599f367eaa21f/public/audio/no_audio.mp3";

export default class IdbAudio {
  constructor(opts = {}) {
    if (typeof(opts) === 'string') {
      opts = { src: opts };
    }
    let {
      src = URL_NO_AUDIO,
      audioContext,
    } = opts;
    if (audioContext == null) {
      audioContext = new AudioContext();
      audioContext.resume(); // for iOS
    }
    Object.assign(this, {
      src,
      audioContext,
      currentTime: 0,
    });
  }

  get paused() {
    let { audioContext } = this;
    return audioContext.state === 'suspended';
  }

  pause() {
    let { audioContext } = this;
    audioContext.suspend();
  }

  async play() {
    try {
      let { audioContext } = this;

      const audio = useAudioStore();
      let { src } = this;
      audioContext.resume();
      let abuf = await audio.fetchAudioBuffer(src);
      return abuf;
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



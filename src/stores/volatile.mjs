import { defineStore } from 'pinia'
import { SuttaRef } from "scv-esm/main.mjs";
import { logger } from "log-instance";
import { ref } from "vue";
import { useSettingsStore } from "./settings.mjs";
import Utils from "../utils.mjs";
import * as Idb from "idb-keyval";

const suttas = new Map();
const layout = ref();
const showSettings = ref(false);
const URL_CLICK = "audio/click1.mp3";
const SAMPLE_RATE = 48000;
const INITIAL_STATE = {
  alertMsg: ref(null),
  showAlertMsg: ref(false),
  waiting: 0,
  waitingMsg: ref('...'),
  waitingDelay: ref(500),
  showWaiting: ref(false),
  audioSutta: ref(null),
  audioScid: ref(''),
  audioFocused: ref(false),
  delayedWaiting: 0,
  suttas,
  showSettings,
};

export const useVolatileStore = defineStore('volatile', {
  state: () => {
    let s = Object.assign({}, INITIAL_STATE);
    logger.debug(`volatile.state() => `, s);
    return s;
  },
  getters: {
    urlClick() {
      let settings = useSettingsStore();
      let volume = settings.clickVolume;
      return volume ? `audio/click${volume}.mp3` : null;
    },
    layout() {
      let root = document.documentElement;
      let onresize = ()=>{
        layout.value = {
          w: root.clientWidth,
          h: root.clientHeight,
        }
      }
      if (layout.value == null) {
        document.defaultView.onresize = onresize;
        onresize();
      }
      return layout;
    },
  },
  actions: {
    getAudioContext() {
      let audioContext = new AudioContext();
      audioContext.resume();
      return audioContext;
    },
    playClick(audioContext=this.getAudioContext()) {
      return this.playUrl(this.urlClick, {audioContext});
    },
    playUrl(url, opts={}) {
      let { audioContext=this.getAudioContext() } = opts;
      if (url) {
        audioContext.resume();
        return this.playUrlAsync(url, {audioContext});
      }

      return null;
    },
    async playUrlAsync(url, opts={}) {
      try {
        if (url == null) {
          logger.debug("volatile.playUrlAsync(null)");
          return;
        }
        let { audioContext } = opts;
        let headers = new Headers();
        headers.append('Accept', 'audio/mpeg');
        let resClick = await fetch(url, { headers });
        if (!resClick.ok) {
          let msg = `volatile.playUrlAsync() ${url} => HTTP${resClick.status}`;
          let e = new Error(msg);
          e.url = url;
          logger.warn(msg);
          this.alert(msg, 'ebt.audioError');
          return;
        }
        let urlBuf = await resClick.arrayBuffer();
        let audioSource = audioContext.createBufferSource();
        let urlAudio = await new Promise((resolve, reject)=>{
          audioContext.decodeAudioData(urlBuf, resolve, reject);
        });
        let numberOfChannels = Math.min(2, urlAudio.numberOfChannels);
        let length = urlAudio.length;
        let sampleRate = Math.max(SAMPLE_RATE, urlAudio.sampleRate);
        logger.debug(`volatile.playUrlAsync(${url})`, 
          {sampleRate, length, numberOfChannels});
        let audioBuffer = audioContext.createBuffer(
          numberOfChannels, length, sampleRate);
        for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
          let offset = 0;
          let channelData = new Float32Array(length);
          channelData.set(urlAudio.getChannelData(channelNumber), offset);
          offset += urlAudio.length;
          audioBuffer.getChannelData(channelNumber).set(channelData);
        }

        audioSource.buffer = audioBuffer;
        audioSource.connect(audioContext.destination);
        return new Promise((resolve, reject) => { try {
          audioSource.onended = evt => {
            logger.debug(`volatile.playUrlAsync(${url}) => OK`);
            resolve();
          };
          audioSource.start();
        } catch(e) {
          let msg = `volatile.playUrlAsync(${url}) => ${e.message}`;
          logger.warn(msg);
          alert(msg);
          reject(e);
        }}); // Promise
      } catch(e) {
        this.alert(`volatile.playUrlAsync(${url}) => ${e.message}`, 'ebt.audioError');
        throw e;
      }
    },
    alert(msg, context) {
      this.alertMsg = msg && { msg, context };
      this.showAlertMsg = !!msg;
    },
    waitBegin(msg) {
      msg && (this.waitingMsg = msg);
      if (this.waiting === 0) {
        setTimeout(()=>{
          if (this.waiting > 0) {
            this.showWaiting = true;
          }
        }, this.waitingDelay);
      }
      this.waiting++;
    },
    waitEnd() {
      this.waiting--;
      if (this.waiting <= 0) {
        this.showWaiting = false;
      }
    },
    addMlDoc(mld) {
      let { sutta_uid, lang, author_uid:author } = mld || {};
      let suttaRef = SuttaRef.create({sutta_uid, lang, author});
      let key = suttaRef.toString();
      logger.info("volatile.addMlDoc", {key, mld});
      suttas[key] = mld;
    },
    mlDocFromSuttaRef(suttaRefArg) {
      let suttaRef = SuttaRef.create(suttaRefArg);
      let key = suttaRef.toString();
      return suttas[key];
    },
    async setAudioSutta(audioSutta, audioIndex=0) {
      logger.debug("volatile.setAudioSutta()", {audioSutta, audioIndex});
      this.audioSutta = audioSutta;
      this.audioIndex = audioIndex;

      let segments = audioSutta?.segments;
      let audioScid = segments
        ? segments[audioIndex].scid
        : null;
      this.audioScid = audioScid;
      if (audioScid) {
        this.updateAudioExamples();
      }
    },
    updateAudioExamples() {
      let { audioSutta, audioIndex } = this;
      let segments = audioSutta?.segments;
      if (segments) {
        let seg = segments[audioIndex];
        let updated = audioSutta.highlightExamples({seg});
        if (updated) {
          seg.examples = updated;
        }
        logger.debug("volatile.updateAudioExamples()", {updated, seg, audioIndex});
      } else {
        logger.debug("volatile.updateAudioExamples() SKIP", 
          {audioSutta, audioIndex, segments});
      }
    },
    async fetch(url, options={}) {
      let res;
      try {
        this.waitBegin();
        logger.info('volatile.fetch()', url);
        let fetchOpts = Object.assign({
    //      mode: 'no-cors',
        }, options);
        res = await fetch(url, fetchOpts);
        logger.debug('volatile.fetch() =>', res);
      } catch(e) {
        logger.error("volatile.fetch() ERROR:", res, e);
        res = { error: `ERROR: ${url.value} ${e.message}` };
      } finally {
        this.waitEnd();
      }
      return res;
    },
    async fetchJson(url, options) {
      try {
        let res = await this.fetch(url, options);;
        return res.ok ? await res.json() : res;
      } catch(e) {
        logger.error("volatile.fetchJson() ERROR:", res, e);
        res = { error: `ERROR: ${url.value} ${e.message}` };
      }
      return res;
    },
  },
})

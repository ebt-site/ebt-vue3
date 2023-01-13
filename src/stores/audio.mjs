import { defineStore } from 'pinia';
import { logger } from 'log-instance';
import { SuttaRef, Authors } from 'scv-esm/main.mjs';
import { useSettingsStore } from './settings.mjs';
import { useVolatileStore } from './volatile.mjs';
import { default as EbtSettings } from '../ebt-settings.mjs';
import { default as IdbSutta } from '../idb-sutta.mjs';
import { ref } from 'vue';
import * as Idb from 'idb-keyval';

const MSDAY = 24 * 3600 * 1000;
const VUEREFS = new Map();
const HEADERS_JSON = { ["Accept"]: "application/json", };
const HEADERS_MPEG = { ["Accept"]: "audio/mpeg", };
const SAMPLE_RATE = 48000;
var audioDb;

function AUDIO_STORE() {
  if (audioDb === undefined) {
    audioDb = Idb.createStore('audio-db', 'audio-store')
  }
  return audioDb;
}

export const useAudioStore = defineStore('audio', {
  state: () => {
    return {
      nFetch: 0,
      nGet: 0,
      nSet: 0,
      audioIndex: ref(0),
      audioSutta: ref(null),
      audioScid: ref(''),
      audioFocused: ref(false),
    }
  },
  getters: {
  },
  actions: {
    playClick(audioContext=this.getAudioContext()) {
      let settings = useSettingsStore();
      let volume = settings.clickVolume;
      let url =  volume ? `audio/click${volume}.mp3` : null;
      return this.playUrl(url, {audioContext});
    },
    playBell(audioContext=this.getAudioContext()) {
      let settings = useSettingsStore();
      let { ips } = settings;
      let ipsChoice = EbtSettings.IPS_CHOICES.filter(c=>c.value===ips)[0];
      let url = ipsChoice?.url?.substring(1);
      console.log("DBG0111 bellUrl", {ipsChoice, ips, url});
      return this.playUrl(url, {audioContext});
    },
    async setAudioSutta(audioSutta, audioIndex=0) {
      logger.debug("audio.setAudioSutta()", {audioSutta, audioIndex});
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
        logger.debug("audio.updateAudioExamples()", {updated, seg, audioIndex});
      } else {
        logger.debug("audio.updateAudioExamples() SKIP", 
          {audioSutta, audioIndex, segments});
      }
    },
    getAudioContext() {
      // IMPORTANT! Call this from a user-initiated non-async context
      let audioContext = new AudioContext();
      audioContext.resume(); // required for iOS
      return audioContext;
    },
    segAudioKey(idOrRef, settings=useSettingsStore()) {
      let { langTrans, serverUrl, vnameTrans, vnameRoot } = settings;
      let suttaRef = SuttaRef.create(idOrRef, langTrans);
      let { sutta_uid, lang, author, segnum } = suttaRef;
      author = author || Authors.langAuthor(lang);
      if (author == null) {
        let msg = `audio.segmentAudioUrl() author is required: ` +
          JSON.stringify(idOrRef);
        console.trace(msg);
        throw new Error(msg);
      }
      let key = `${sutta_uid}:${segnum}/${lang}/${author}/${vnameTrans}/${vnameRoot}`;
      return key;
    },
    async fetchSegmentAudio(idOrRef, settings=useSettingsStore()) {
      const volatile = useVolatileStore();
      let segAudio;
      try {
        volatile.waitBegin("ebt.loadingAudio");
        let audioUrl = this.segmentAudioUrl(idOrRef, settings);
        let resAudio = await fetch(audioUrl, { headers: HEADERS_JSON });
        segAudio = await resAudio.json();
        logger.info("fetchSegmentAudio()", audioUrl);
      } catch(e) {
        volatile.alert(e);
        throw e;
      } finally {
        volatile.waitEnd();
      }
      return segAudio;
    },
    async getSegmentAudio(idOrRef, settings=useSettingsStore()) {
      let segAudio = await this.fetchSegmentAudio(idOrRef, settings);
      let segAudioKey = this.segAudioKey(idOrRef, settings);
      await Idb.set(segAudioKey, segAudio, AUDIO_STORE());
      logger.debug("audio.fetchSegmentAudio()", segAudioKey);
      return segAudio;
    },
    segmentAudioUrl(idOrRef, settings=useSettingsStore()) {
      let { langTrans, serverUrl, vnameTrans, vnameRoot } = settings;
      let suttaRef = SuttaRef.create(idOrRef, langTrans);
      let { sutta_uid, lang, author, segnum } = suttaRef;
      author = author || Authors.langAuthor(lang);
      if (author == null) {
        let msg = `segmentAudioUrl() author is required ${JSON.stringify(idOrRef)}`;
        throw new Error(msg);
      }
      let url =  [ 
        serverUrl, 
        'play', 
        'segment',
        sutta_uid,
        lang,
        author,
        `${sutta_uid}:${segnum}`,
        vnameTrans,
        vnameRoot,
      ].join('/'); 
      return url;
    },
    playUrl(url, opts={}) {
      let { audioContext=this.getAudioContext() } = opts;
      return this.playUrlAsync(url, {audioContext});
    },
    async playUrlAsync(url, opts) {
      if (url == null) {
        return null;
      }
      let arrayBuffer = await this.fetchArrayBuffer(url, opts);
      console.log("DEBUG0101 playUrlAsync", arrayBuffer.byteLength);
      let promise = this.playArrayBuffer({arrayBuffer, audioContext, });
      return promise;
    },
    async fetchArrayBuffer(url, opts={}) {
      const volatile = useVolatileStore();
      let { headers=HEADERS_MPEG } = opts;
      try {
        let res = await fetch(url, { headers });
        logger.debug(`audio.fetchArrayBuffer(${url}) => HTTP${res.status}:`);
        let abuf = await res.arrayBuffer();
        logger.info(`audio.fetchArrayBuffer() ${url}=> ${abuf.byteLength}B`);
        return abuf;
      } catch(e) {
        let msg = `audio.fetchArrayBuffer() ${url} => ${e.message}`;
        volatile.alert(msg, 'ebt.audioError');
        throw new Error(msg);
      }
    },
    async langAudioUrl(idOrRef, lang, settings=useSettingsStore()) {
      let { serverUrl, langTrans } = settings;
      if (typeof lang !== 'string') {
        if (lang) {
          throw new Error(`audio.langAudioUrl() lang is required: ${lang}`);
        }
        lang = settings.langTrans;
      }
      lang = lang.toLowerCase();
      let segRef = EbtSettings.segmentRef(idOrRef, settings);
      let suttaRef = SuttaRef.create(segRef, langTrans);
      let { author } = suttaRef;
      author = author || Authors.langAuthor(lang);
      let segAudio = await this.getSegmentAudio(segRef, settings);
      let { sutta_uid, translator, segment, vnameRoot, vnameTrans } = segAudio;
      let { audio } = segment;
      let guid = segment.audio[lang];
      let text = segment[lang];
      let url = null;
      if (text) {
        url = [
          serverUrl,
          'audio',
          sutta_uid,
          lang,
          lang === 'pli' ? 'ms' : translator,
          lang === langTrans ? vnameTrans : vnameRoot,
          guid,
        ].join('/');
      }
      return url;
    },
    async createAudioBuffer({audioContext, arrayBuffer}) {
      const msgPrefix = 'audio.createAudioBuffer()';
      const volatile = useVolatileStore();
      try {
        if (arrayBuffer.byteLength < 500) {
          let msg = `${msgPrefix} invalid arrayBuffer`;
          volatile.alert(msg, 'ebt.audioError');
          throw new Error(msg);
        }
        let audioData = await new Promise((resolve, reject)=>{
          audioContext.decodeAudioData(arrayBuffer, resolve, reject);
        });
        let numberOfChannels = Math.min(2, audioData.numberOfChannels);
        let length = audioData.length;
        let sampleRate = Math.max(SAMPLE_RATE, audioData.sampleRate);
        logger.debug(`${msgPrefix}`, {sampleRate, length, numberOfChannels});
        let audioBuffer = audioContext.createBuffer(
          numberOfChannels, length, sampleRate);
        for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
          let rawData = new Float32Array(length);
          rawData.set(audioData.getChannelData(channelNumber), 0);
          audioBuffer.getChannelData(channelNumber).set(rawData);
        }

        return audioBuffer;
      } catch(e) {
        let msg = `${msgPrefix} ERROR`;
        logger.warn(msg);
        console.trace(msg, e);
        throw e;
      }
    },
    async createAudioSource({audioContext, audioBuffer}) {
      let msgPrefix = 'IdbAudio.createAudioSource';
      const volatile = useVolatileStore();
      let audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      audioSource.connect(audioContext.destination);
      return audioSource;
    },
    async playAudioSource({audioContext, audioSource}) {
      let msg = 'IdbAudio.playAudioSource() ';
      const volatile = useVolatileStore();
      return new Promise((resolve, reject) => { try {
        audioSource.onended = evt => {
          logger.debug(`${msg} => OK`);
          resolve();
        };
        audioSource.start();
      } catch(e) {
        volatile.alert(e, 'ebt.audioError');
        reject(e);
      }}); // Promise
    },
    async playArrayBuffer({arrayBuffer, audioContext, }) {
      let msg = `audio.playArrayBuffer(${arrayBuffer.byteLength}B)`;
      const volatile = useVolatileStore();
      try {
        let audioBuffer = await this.createAudioBuffer({audioContext, arrayBuffer});
        let audioSource = await this.createAudioSource({audioBuffer, audioContext});
        return this.playAudioSource({audioContext, audioSource});
      } catch(e) {
        volatile.alert(e, 'ebt.audioError');
        throw e;
      }
    },
    async playUrlAsync(url, opts={}) {
      let msg = `audio.playUrlAsync() `;
      let volatile = useVolatileStore();
      try {
        if (url == null) {
          logger.debug(`${msg} url:null`);
          return;
        }
        let { audioContext, headers=HEADERS_MPEG } = opts;
        let resClick = await fetch(url, { headers });
        if (!resClick.ok) {
          msg += ` ${url} => HTTP${resClick.status}`;
          let e = new Error(msg);
          e.url = url;
          volatile.alert(e, 'ebt.audioError');
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
        logger.debug(msg + url, {sampleRate, length, numberOfChannels});
        let audioBuffer = audioContext.createBuffer(
          numberOfChannels, length, sampleRate);
        for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
          let channelData = new Float32Array(length);
          channelData.set(urlAudio.getChannelData(channelNumber), 0);
          audioBuffer.getChannelData(channelNumber).set(channelData);
        }

        audioSource.buffer = audioBuffer;
        audioSource.connect(audioContext.destination);
        return new Promise((resolve, reject) => { try {
          audioSource.onended = evt => {
            logger.debug(`audio.playUrlAsync(${url}) => OK`);
            resolve();
          };
          audioSource.start();
        } catch(e) {
          volatile.alert(e);
          reject(e);
        }}); // Promise
      } catch(e) {
        volatile.alert(e, 'ebt.audioError');
        throw e;
      }
    },
  },
  getters: {
  },
})

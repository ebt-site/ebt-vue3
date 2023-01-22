import { defineStore } from 'pinia';
import { logger } from 'log-instance';
import { SuttaRef, Authors } from 'scv-esm/main.mjs';
import { useSettingsStore } from './settings.mjs';
import { useVolatileStore } from './volatile.mjs';
import { default as EbtSettings } from '../ebt-settings.mjs';
import { default as IdbSutta } from '../idb-sutta.mjs';
import { ref, nextTick } from 'vue';
import * as Idb from 'idb-keyval';

const MSDAY = 24 * 3600 * 1000;
const VUEREFS = new Map();
const HEADERS_JSON = { ["Accept"]: "application/json", };
const HEADERS_MPEG = { ["Accept"]: "audio/mpeg", };
const SAMPLE_RATE = 48000;
var segAudioDb;
var soundDb;

function SEG_AUDIO_STORE() {
  if (segAudioDb === undefined) {
    segAudioDb = Idb.createStore('seg-audio-db', 'seg-audio-store')
  }
  return segAudioDb;
}

function SOUND_STORE() {
  if (soundDb === undefined) {
    soundDb = Idb.createStore('sound-db', 'sound-store')
  }
  return soundDb;
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
    async clearSoundCache() {
      const msg = 'audio.clearSoundCache() ';
      try {
        logger.warn(msg);
        const DBDeleteRequest = window.indexedDB.deleteDatabase("sound-db");
        DBDeleteRequest.onerror = (event) => {
          console.error(msg + "Error deleting database.");
        };

        DBDeleteRequest.onsuccess = (event) => {
          console.log(msg + "Database deleted successfully");
          console.log(msg, event.result); // should be undefined
        };
        segAudioDb = null;
        console.log(msg, {segAudioDb, DBDeleteRequest});
        nextTick(()=>window.location.reload());
      } catch(e) {
        logger.warn(msg + 'ERROR', e.message);
        throw e;
      }
    },
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
        this.nFetch++;
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
      const msg = 'audio.getSegmentAudio() ';
      let segAudio = await this.fetchSegmentAudio(idOrRef, settings);
      let segAudioKey = this.segAudioKey(idOrRef, settings);
      await Idb.set(segAudioKey, segAudio, SEG_AUDIO_STORE());
      logger.debug(msg, segAudioKey);
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
      let { audioContext=this.getAudioContext() } = opts;
      if (url == null) {
        return null;
      }

      let arrayBuffer = await this.fetchArrayBuffer(url, opts);
      let promise = this.playArrayBuffer({arrayBuffer, audioContext, });
      return promise;
    },
    async fetchArrayBuffer(url, opts={}) {
      const msg = `audio.fetchArrayBuffer() ${url}`;
      const volatile = useVolatileStore();
      let { headers=HEADERS_MPEG } = opts;
      try {
        let urlParts = url.split('/');
        let iKey = Math.max(0, urlParts.length-4);
        let idbKey = urlParts.slice(iKey).join('/');
        let abuf = await Idb.get(idbKey, SOUND_STORE());
        if (abuf) {
          logger.info(msg, `=> cached`);
        } else {
          this.nFetch++;
          let res = await fetch(url, { headers });
          logger.info(msg, `=> HTTP${res.status}`);
          abuf = await res.arrayBuffer();
          await Idb.set(idbKey, abuf, SOUND_STORE());
        }
        logger.debug(`audio.fetchArrayBuffer() ${url}=> ${abuf.byteLength}B`);
        return abuf;
      } catch(e) {
        let eNew = new Error(`${msg} => ${e.message}`);
        volatile.alert(eNew.message, 'ebt.audioError');
        throw eNew;
      }
    },
    async langAudioUrl(opts={}) {
      const msg = 'audio.langAudioUrl() ';
      let {idOrRef, lang, settings=useSettingsStore(), segAudio} = opts;
      let { serverUrl, langTrans } = settings;
      if (typeof lang !== 'string') {
        if (lang) {
          throw new Error(msg + `lang is required: ${lang}`);
        }
        lang = settings.langTrans;
      }
      lang = lang.toLowerCase();
      let segRef = EbtSettings.segmentRef(idOrRef, settings);
      let suttaRef = SuttaRef.create(segRef, langTrans);
      let { author } = suttaRef;
      author = author || Authors.langAuthor(lang);
      segAudio = segAudio || await this.getSegmentAudio(segRef, settings);
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
  },
  getters: {
  },
})

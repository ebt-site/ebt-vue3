
import { defineStore } from 'pinia';
import { logger } from 'log-instance';
import { SuttaRef, Authors } from 'scv-esm/main.mjs';
import { useSettingsStore } from './settings.mjs';
import { useVolatileStore } from './volatile.mjs';
import { default as EbtSettings } from '../ebt-settings.mjs';
import { default as IdbSutta } from '../idb-sutta.mjs';
import * as Idb from 'idb-keyval';

const MSDAY = 24 * 3600 * 1000;
const VUEREFS = new Map();
const HEADERS_JSON = { ["Accept"]: "application/json", };
const HEADERS_MPEG = { ["Accept"]: "audio/mpeg", };
const URL_CLICK = "audio/click1.mp3";
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
    }
  },
  actions: {
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
      let audioUrl = this.segmentAudioUrl(idOrRef, settings);
      let resAudio = await fetch(audioUrl, { headers: HEADERS_JSON });
      let segAudio = await resAudio.json();
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
    async fetchAudioBuffer(url, opts={}) {
      const volatile = useVolatileStore();
      let { headers=HEADERS_MPEG } = opts;
      logger.info(`audio.fetchAudioBuffer()`, url);
      try {
        let res = await fetch(url, { headers });
        logger.info(`audio.fetchAudioBuffer(${url})`, res);
        let abuf = await res.arrayBuffer();
        logger.info(`audio.fetchAudioBuffer() => ${abuf.byteLength}B`);
        return abuf;
      } catch(e) {
        let msg = `audio.fetchAudioBuffer() ${url} => ${e.message}`;
        console.trace(msg);
        volatile.alert(msg, 'ebt.audioError');
        throw new Error(msg);
      }
    },
    async langAudioUrl(idOrRef, lang, settings=useSettingsStore()) {
      let { serverUrl, langTrans } = settings;
      if (lang == null) {
        throw new Error("audio.langAudioUrl() lang is required");
      }
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
    async playArrayBuffer({arrayBuffer, audioContext, }) {
      const size = arrayBuffer instanceof ArrayBuffer
        ? `${arrayBuffer.byteLength}B`
        : 0;
      const volatile = useVolatileStore();
      if (size < 500) {
        let msg = `audio.playArrayBuffer(${size}) invalid arrayBuffer`;
        console.trace(msg);
        volatile.alert(msg, 'ebt.audioError');
        throw new Error(msg);
      }
      try {
        let audioData = await new Promise((resolve, reject)=>{
          audioContext.decodeAudioData(arrayBuffer, resolve, reject);
        });
        let numberOfChannels = Math.min(2, audioData.numberOfChannels);
        let length = audioData.length;
        let sampleRate = Math.max(SAMPLE_RATE, audioData.sampleRate);
        logger.debug(`audio.playArrayBuffer(${size})`, 
          {sampleRate, length, numberOfChannels});
        let audioBuffer = audioContext.createBuffer(
          numberOfChannels, length, sampleRate);
        for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
          let offset = 0;
          let channelData = new Float32Array(length);
          channelData.set(audioData.getChannelData(channelNumber), offset);
          offset += audioData.length;
          audioBuffer.getChannelData(channelNumber).set(channelData);
        }

        let audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.connect(audioContext.destination);
        return new Promise((resolve, reject) => { try {
          audioSource.onended = evt => {
            logger.debug(`audio.playArrayBuffer(${size}) => OK`);
            resolve();
          };
          audioSource.start();
        } catch(e) {
          let msg = `audio.playArrayBuffer(${size}) => ${e.message}`;
          console.trace(msg);
          volatile.alert(msg, 'ebt.audioError');
          reject(e);
        }}); // Promise
      } catch(e) {
        let msg = `audio.playArrayBuffer(${size}) => ${e.message}`; 
        console.trace(msg);
        volatile.alert(msg, 'ebt.audioError');
        throw e;
      }
    },
    async playUrlAsync(url, opts={}) {
      try {
        if (url == null) {
          logger.debug("volatile.playUrlAsync(null)");
          return;
        }
        let { audioContext, headers=HEADERS_MPEG } = opts;
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
  },
  getters: {
  },
})

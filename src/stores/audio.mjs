
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

export const useAudioStore = defineStore('audio', {
  state: () => {
    return {
      nFetch: 0,
      nGet: 0,
      nSet: 0,
    }
  },
  actions: {
    async getSegmentAudioBuffer(idOrRef, lang) {
      let volatile = useVolatileStore();
      let settings = useSettingsStore();
      let suttaRef = SuttaRef.create('thig1.1:0.1/en/sujato');
      let url = await this.langAudioUrl(idOrRef, lang);
      try {
        let audioContext = new AudioContext();
        let arrayBuffer = await this.fetchAudioBuffer(url);
        await this.playArrayBuffer({arrayBuffer, audioContext});
      } catch(e) {
        logger.warn(e.message);
        volatile.alert(e.message);
      }
    },
    async fetchSegmentAudio(idOrRef) {
      let settings = useSettingsStore();
      let audioUrl = this.segmentAudioUrl(idOrRef);
      let resAudio = await fetch(audioUrl, { headers: HEADERS_JSON });
      return await resAudio.json();
    },
    async getSegmentAudio(idOrRef) {
      return this.fetchSegmentAudio(idOrRef);
    },
    segmentAudioUrl(idOrRef) {
      let settings = useSettingsStore();
      let { langTrans, serverUrl, vnameTrans } = settings;
      let suttaRef = SuttaRef.create(idOrRef, langTrans);
      let { sutta_uid, lang, author, segnum } = suttaRef;
      author = author || Authors.langAuthor(lang);
      if (author == null) {
        let msg = `segmentAudioUrl() author is required ${JSON.stringify(idOrRef)}`;
        throw new Error(msg);
      }
      let segSpec = `${sutta_uid}/${lang}/${author}`;
      let url =  [ 
        serverUrl, 
        'play', 
        'segment',
        sutta_uid,
        lang,
        author,
        `${sutta_uid}:${segnum}`,
        vnameTrans,
      ].join('/'); 
      return url;
    },
    async fetchAudioBuffer(url, opts={}) {
      let { headers=HEADERS_MPEG } = opts;
      logger.info(`audio.fetchAudioBuffer()`, url);
      let res = await fetch(url, { headers });
      logger.info(`audio.fetchAudioBuffer(${url})`, res);
      let abuf = await res.arrayBuffer();
      logger.info(`audio.fetchAudioBuffer() => ${abuf.byteLength}B`);
      return abuf;
    },
    async langAudioUrl(idOrRef, lang, settings=useSettingsStore()) {
      let segRef = EbtSettings.segmentRef(idOrRef, settings);
      let { serverUrl, vnameRoot, vnameTrans, lang:langTrans } = settings;
      let suttaRef = SuttaRef.create(segRef, lang);
      let { author } = suttaRef;
      author = author || Authors.langAuthor(lang);
      let segAudio = await this.getSegmentAudio(segRef);
      let { sutta_uid, translator, segment, } = segAudio;
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
      const size = `${arrayBuffer.byteLength}B`;
      const volatile = useVolatileStore();
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
          logger.warn(msg);
          alert(msg);
          reject(e);
        }}); // Promise
      } catch(e) {
        volatile.alert(`audio.playArrayBuffer(${size}) => ${e.message}`, 
          'ebt.audioError');
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

import { defineStore } from 'pinia';
import { logger } from 'log-instance/index.mjs';
import { SuttaRef, Authors } from 'scv-esm/main.mjs';
import { useSettingsStore } from './settings.mjs';
import { useVolatileStore } from './volatile.mjs';
import { default as EbtSettings } from '../ebt-settings.mjs';
import { default as IdbSutta } from '../idb-sutta.mjs';
import { default as IdbAudio } from '../idb-audio.mjs';
import { ref, nextTick } from 'vue';
import * as Idb from 'idb-keyval';

const MSDAY = 24 * 3600 * 1000;
const VUEREFS = new Map();
const URL_NOAUDIO = "audio/383542__alixgaus__turn-page.mp3"; 
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

function deleteDatabase(name) {
  const DBDeleteRequest = window.indexedDB.deleteDatabase(name);

  DBDeleteRequest.onerror = (event) => {
    console.error(msg + `Error deleting database: ${name}`);
  };

  DBDeleteRequest.onsuccess = (event) => {
    console.log(msg + `Database ${name} deleted successfully`);
    console.log(msg, event.result); // should be undefined
  };

  return DBDeleteRequest;
}

const PLAY_ONE = 'one';
const PLAY_END = 'end';

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
      mainContext: ref(null),
      segmentPlaying: ref(false),
      audioElapsed: ref(0),
      idbAudio: ref(undefined),
      playMode: ref(PLAY_ONE),
      clickElt: ref(undefined),
    }
  },
  getters: {
  },
  actions: {
    keydown(evt) {
      const msg = `audio.keydown(${evt.code}) `;
      switch (evt.code) {
        case 'ArrowUp':
          if (evt.ctrlKey) {
            this.setLocation(0);
          } else if (evt.shiftKey) {
            this.incrementGroup(-1);
          } else {
            this.back();
          }
          break;
        case 'ArrowDown':
          if (evt.ctrlKey) {
            this.setLocation(-1);
          } else if (evt.shiftKey) {
            this.incrementGroup(1);
          } else {
            this.next();
          }
          break;
        case 'Space':
          if (!evt.altKey && !evt.metaKey) {
            if (evt.shiftKey || evt.ctrlKey) {
              this.clickPlayToEnd();
            } else {
              this.clickPlayOne();
            }
          }
          break;
        case 'Enter':
          this.clickPlayToEnd();
          break;
        default: 
          // Defer to App.vue keydown listener
          return;
      }
      evt.preventDefault();
    },
    playPause(playMode) {
      let { idbAudio, mainContext, } = this;
      this.playClick();

      if (idbAudio?.audioSource) {
        if (!idbAudio.paused) {
          idbAudio.pause();
          return true;
        }
        if (playMode === this.playMode) {
          idbAudio.play();
          return true;
        } 
        return false;
      }

      mainContext && mainContext.close();
      //this.createIdbAudio();
      this.playMode = playMode;
      return false;
    },
    async playOne() {
      const msg = 'audio.playOne() ';
      logger.debug(msg +'PLAY', this.audioScid);
      let completed = await this.playSegment();
      if (!completed) {
        // interrupted
      } else if (await this.next()) {
        logger.debug(msg+'OK');
      } else {
        logger.debug(msg+'END');
        this.playBell();
      }
    },
    clickPlayOne() {
      let msg = 'audio.clickPlayOne() ';

      if (this.playPause(PLAY_ONE)) {
        logger.info(msg + 'toggled');
        return;
      }

      logger.info(msg + 'playing');
      this.createIdbAudio();
      this.playOne();
    },
    async playToEnd() {
      const msg = 'audio.playToEnd() ';
      logger.info(msg+'PLAY', this.audioScid);
      let segPlayed;
      do {
        segPlayed = await this.playSegment();
      } while(segPlayed && (await this.next()));
      if (segPlayed) {
        logger.info(msg+'END');
        await this.playBell();
      }
    },
    clickPlayToEnd() {
      const msg = 'audio.clickPlayToEnd() ';
      if (this.playPause(PLAY_END)) {
        logger.debug(msg + 'toggled');
        return;
      }

      logger.info(msg + 'playing');
      this.createIdbAudio();
      this.playToEnd();
    },
    back() {
      return this.incrementSegment(-1);
    },
    next() {
      return this.incrementSegment(1);
    },
    setLocation(delta=0) {
      const msg = `audio.setLocation(${delta}) `;
      let volatile = useVolatileStore();
      let { routeCard } = volatile;
      let { audioSutta, } = this;
      let { segments } = audioSutta;
      let incRes = routeCard.setLocation({ segments, delta, });
      if (incRes) {
        let settings = useSettingsStore();

        let { iSegment } = incRes;
        let seg = segments[iSegment];
        this.audioScid = segments[iSegment].scid;
        volatile.setRoute(routeCard.routeHash(), true);
        this.playSwoosh();
        logger.debug(msg, incRes);
      } else {
        this.playBell();
        logger.debug(msg+'END');
      }

      return incRes;
    },
    incrementGroup(delta=1) {
      const msg = `audio.incrementGroup(${delta}) `;
      let volatile = useVolatileStore();
      let { routeCard } = volatile;
      let { audioSutta, } = this;
      let { segments } = audioSutta;
      let incRes = routeCard.incrementGroup({segments, delta});
      if (incRes) {
        let settings = useSettingsStore();

        let { iSegment } = incRes;
        let seg = segments[iSegment];
        this.audioScid = segments[iSegment].scid;
        volatile.setRoute(routeCard.routeHash(), true);
        this.playSwoosh();
        logger.debug(msg, incRes);
      } else {
        this.playBell();
        logger.debug(msg+'END');
      }

      return incRes;
    },
    async playSegment() {
      const msg = `audio.playSegment() `;
      let volatile = useVolatileStore();
      let settings = useSettingsStore();
      let audio = this;
      let { routCard } = volatile;
      let { idbAudio, audioScid } = audio;
      let segAudio = await audio.bindSegmentAudio();
      let { segment:seg, langTrans } = segAudio;

      logger.debug(`${msg} ${audioScid}`);

      let interval;
      try {
        audio.audioElapsed = -2;
        interval = setInterval( ()=>{
          let currentTime = audio.idbAudio?.currentTime || -1;
          audio.audioElapsed = currentTime/1000;
          if (audio.audioScid !== audioScid) {
            clearInterval(interval);
            logger.debug(msg + `interrupt`, 
              interval,
              `${audioScid}=>${audio.audioScid}`);
            audio.segmentPlaying = false;
            idbAudio.clear();
          }
        }, 100);
        logger.debug(msg + 'setInterval', interval);
        audio.segmentPlaying = true;

        let idOrRef = audioScid;
        if (audio.segmentPlaying && settings.speakPali && seg.pli) {
          let src = await audio.pliAudioUrl;
          idbAudio.src = src;
          logger.debug(`${msg} pliUrl:`, src);
          await idbAudio.play();
        }

        if (audio.segmentPlaying && settings.speakTranslation && seg[langTrans]) {
          let lang = settings.langTrans;
          let src = await audio.transAudioUrl;
          idbAudio.src = src;
          logger.debug(`${msg} transUrl:`, src);
          await idbAudio.play();
        }
        logger.debug(msg + 'clearInterval', interval);
        clearInterval(interval);
        interval = undefined;
      } catch(e) {
        clearInterval(interval);
        interval = undefined;
        logger.warn(msg, e);
      } finally {
        audio.audioElapsed = -1;
      }

      logger.debug(`${msg} segmentPlaying`, audio.segmentPlaying);

      if (!audio.segmentPlaying) {
        return false; // interrupted
      }

      audio.segmentPlaying = false;
      return true; // completed
    },
    audioDuration() {
      let duration = this.idbAudio?.audioBuffer?.duration;
      return duration;
    },
    createIdbAudio() {
      const msg = "audio.createIdbAudio() ";
      //console.trace(msg);
      // NOTE: Caller must be UI callback (iOS restriction)
      let audioContext = this.mainContext = this.getAudioContext();
      let idbAudio = this.idbAudio = new IdbAudio({audioContext});
      return idbAudio;
    },
    async incrementSegment(delta) {
      const msg = `audio.incrementSegment(${delta}) `;
      let volatile = useVolatileStore();
      let { routeCard } = volatile;
      let { audioSutta, } = this;
      let { segments } = audioSutta;
      let incRes = routeCard.incrementLocation({ segments, delta, });
      if (incRes) {
        let settings = useSettingsStore();

        let { iSegment } = incRes;
        let seg = segments[iSegment];
        this.audioScid = segments[iSegment].scid;
        let hash = routeCard.routeHash();
        volatile.setRoute(hash, true);
        this.playClick();
        logger.debug(msg, incRes);
      } else {
        this.playBell();
        logger.debug(msg+'END');
      }
      await new Promise(resolve=>nextTick(()=>resolve())); // sync instance

      return incRes;
    },
    async clearSoundCache() {
      const msg = 'audio.clearSoundCache() ';
      try {
        logger.warn(msg);
        const reqSoundDb = deleteDatabase("sound-db");
        const reqSegAudioDb = deleteDatabase("seg-audio-db");
        segAudioDb = null;
        soundDb = null;
        console.log(msg, {reqSoundDb, reqSegAudioDb});
        nextTick(()=>window.location.reload()); } catch(e) {
        logger.warn(msg + 'ERROR', e.message);
        throw e;
      }
    },
    playSwoosh(audioContext) {
      const msg = 'audio.playSwoosh() ';
      let settings = useSettingsStore();
      let volume = settings.swooshVolume;
      let url =  volume ? `audio/swoosh${volume}.mp3` : null;
      return this.playUrl(url, {audioContext});
    },
    playBlock(audioContext) {
      const msg = 'audio.playBlock() ';
      let settings = useSettingsStore();
      let volume = settings.blockVolume;
      let url =  volume ? `audio/block${volume}.mp3` : null;
      return this.playUrl(url, {audioContext});
    },
    playClick(audioContext) {
      const msg = 'audio.playClick() ';
      let { clickElt } = this;
      if (typeof(clickElt?.play) === 'function') {
        clickElt.play()
      } else {
        console.trace(msg, "no clickElt");
      }
    },
    playBell(audioContext) {
      const msg = 'audio.playBell() ';
      let settings = useSettingsStore();
      let { ips } = settings;
      let ipsChoice = EbtSettings.IPS_CHOICES.filter(c=>c.value===ips)[0];
      let url = ipsChoice?.url?.substring(1);
      return this.playUrl(url, {audioContext});
    },
    async setAudioSutta(audioSutta, audioIndex=0) {
      const msg = 'audio.setAudioSutta() '
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
        let segment = segments[audioIndex];
        let updated = audioSutta.highlightExamples({segment});
        if (updated) {
          segment.examples = updated;
        }
        logger.debug("audio.updateAudioExamples()", {updated, segment, audioIndex});
      } else {
        logger.debug("audio.updateAudioExamples() SKIP", 
          {audioSutta, audioIndex, segments});
      }
    },
    getAudioContext() {
      const msg = "audio.getAudioContext() "
      //console.trace(msg);
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
      let segAudioKey = this.segAudioKey(idOrRef, settings);
      let segAudio = await Idb.get(segAudioKey, SEG_AUDIO_STORE());
      if (segAudio) {
        //console.log("DBG0123 segAudio elapsed", Date.now() - segAudio.created);
      } else {
        segAudio = await this.fetchSegmentAudio(idOrRef, settings);
        segAudio.created = Date.now();
        await Idb.set(segAudioKey, segAudio, SEG_AUDIO_STORE());
      }
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
      let { audioContext } = opts;
      let tempContext = audioContext == null ? this.getAudioContext() : null;
      audioContext = audioContext || tempContext;

      let promise = this.playUrlAsync(url, {audioContext});

      tempContext && promise.then(()=>{
        tempContext.close();
      });

      return promise;
    },
    async playUrlAsync(url, opts) {
      const msg = 'audio.playUrlAsync() ';
      if (url == null) {
        return null;
      }

      let { audioContext } = opts;
      if (audioContext == null) {
        throw new Error(`${msg} audioContext is required`);
      }

      let arrayBuffer = await this.fetchArrayBuffer(url, opts);
      return this.playArrayBuffer({arrayBuffer, audioContext, });
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
          logger.debug(msg, `=> cached`);
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
    async bindSegmentAudio(args={}) {
      const msg = 'sutta.bindSegmentAudio() ';
      let { 
        $t=(t=>t),
        volatile=useVolatileStore(),
        settings=useSettingsStore(),
      } = args;
      let { routeCard } = volatile;
      if (routeCard == null) {
        return null;
      }
      let result;
      let { langTrans, vnameTrans, vnameRoot, serverUrl } = settings;
      let [ scid, lang, author ] = routeCard?.location || {};
      let suttaRef = SuttaRef.create(scid, langTrans);
      let { sutta_uid, segnum } = suttaRef;
      try {
        volatile.waitBegin('ebt.loadingAudio');

        let segAudio = await this.getSegmentAudio(suttaRef);
        let { segment } = segAudio;

        if (settings.speakPali) {
          if (segment.pli) {
            this.pliAudioUrl = [
              serverUrl,
              'audio',
              sutta_uid,
              'pli',
              author,
              vnameRoot,
              segment.audio.pli,
            ].join('/');
          } else {
            this.pliAudioUrl = URL_NOAUDIO;
          }
        }
        if (settings.speakTranslation) {
          let langText = segment[lang];
          if (langText) {
            this.transAudioUrl = [
              serverUrl,
              'audio',
              sutta_uid,
              lang,
              author,
              vnameTrans,
              segment.audio[lang],
            ].join('/');
          } else {
            this.transAudioUrl = URL_NOAUDIO;
          }
        }
        logger.debug(msg + segment.scid);
        result = segAudio;
      } finally {
        volatile.waitEnd();
      }
      return result;
    },
  },
  getters: {
  },
})

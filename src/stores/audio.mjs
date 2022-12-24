
import { defineStore } from 'pinia';
import { logger } from 'log-instance';
import Utils from "../utils.mjs";
import { SuttaRef } from 'scv-esm/main.mjs';
import { useSettingsStore } from './settings.mjs';
import { useVolatileStore } from './volatile.mjs';
import { default as IdbSutta } from '../idb-sutta.mjs';
import { ref, shallowRef } from 'vue';
import * as Idb from 'idb-keyval';

const MSDAY = 24 * 3600 * 1000;
const VUEREFS = new Map();

export const useAudioStore = defineStore('audio', {
  state: () => {
    return {
      maxAge: MSDAY,
      nFetch: 0,
      nGet: 0,
      nSet: 0,
    }
  },
  actions: {
    segmentAudioUrl(idOrRef) {
      let settings = useSettingsStore();
      let { langTrans, serverUrl, vnameTrans } = settings;
      let suttaRef = SuttaRef.create(idOrRef, langTrans);
      let { sutta_uid, lang, author, segnum } = suttaRef;
      if (author == null) {
        msg = `segmentAudioUrl() author is required ${suttaRef.toString()}`;
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
    rootAudioUrl(segAudio) {
      let settings = useSettingsStore();
      let { serverUrl, vnameRoot } = settings;
      let { sutta_uid, segment} = segAudio;
      let lang = 'pli';
      let rootText = segment[lang];
      let url = null;
      if (rootText) {
        url = [
          serverUrl,
          'audio',
          sutta_uid,
          lang,
          'ms',
          vnameRoot,
          segment.audio[lang],
        ].join('/');
      }
      return url;
    },
    translationAudioUrl(segAudio) {
      let settings = useSettingsStore();
      let { serverUrl, vnameTrans } = settings;
      let { translator, sutta_uid, langTrans:lang, segment} = segAudio;
      let langText = segment[lang];
      let url = null;
      if (langText) {
        url = [
          serverUrl,
          'audio',
          sutta_uid,
          lang,
          translator,
          vnameTrans,
          segment.audio[lang],
        ].join('/');
      }
      return url;
    },
  },
  getters: {
  },
})

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

export const useSuttasStore = defineStore('suttas', {
  state: () => {
    return {
      maxAge: MSDAY,
      nFetch: 0,
      nGet: 0,
      nSet: 0,
    }
  },
  actions: {
    suttaUrl(idOrRef) {
      let settings = useSettingsStore();
      let { langTrans, serverUrl } = settings;
      let suttaRef = SuttaRef.create(idOrRef, langTrans);
      let { sutta_uid, lang, author, segnum } = suttaRef;
      let search = `${sutta_uid}/${lang}/${author}`;
      return [ 
        serverUrl, 
        'search', 
        encodeURIComponent(search), 
        lang,
      ].join('/'); 
    },
    async loadIdbSutta(suttaRef, opts={}) { // low-level API
      let { maxAge } = this;
      let { refresh=false } = opts;
      let idbKey = IdbSutta.idbKey(suttaRef);
      let idbData = await Idb.get(idbKey);
      this.nGet++;
      let age = idbData?.saved ? Date.now()-idbData.saved : maxAge+1;
      let idbSutta;

      if (refresh || !idbData || maxAge < age) {
        let volatile = useVolatileStore();
        let url = this.suttaUrl(suttaRef);
        let json = await volatile.fetchJson(url);
        this.nFetch++;
        let { mlDocs, results } = json;
        idbSutta = IdbSutta.create(mlDocs[0]);
        logger.info(`suttas.loadIdbSutta()`,
          url,
          '=>',
          `segments:${idbSutta.segments.length}`,
          );
        await this.saveIdbSutta(idbSutta);
      } else {
        console.log("loadIdbSutta");
        logger.debug(`suttas.loadIdbSutta() idb(${idbKey})`);
        idbSutta = IdbSutta.create(idbData);
      } 

      return idbSutta;
    },
    async saveIdbSutta(idbSutta) { // low-level API
      let { idbKey } = idbSutta;
      let vueRef = VUEREFS.get(idbKey);
      if (vueRef == null) {
        vueRef = shallowRef(idbSutta);
        VUEREFS.set(idbKey, vueRef);
      } else if (vueRef.value !== idbSutta) {
        vueRef.value = idbSutta;
      }
      idbSutta.saved = Date.now();
      logger.info(`suttas.saveIdbSutta()`, idbSutta.saved);
      await Idb.set(idbKey, idbSutta);
      this.nSet++;
      return vueRef;
    },
    async getIdbSuttaRef(suttaRef, opts={refresh:true}) { // get/post API
      let idbKey = IdbSutta.idbKey(suttaRef);
      let vueRef = VUEREFS.get(idbKey);
      let idbSutta = vueRef?.value;

      if (idbSutta == null) {
        if (!opts.refresh) {
          return null;
        }
        idbSutta = await this.loadIdbSutta(suttaRef);
        vueRef = shallowRef(idbSutta);
        VUEREFS.set(idbKey, vueRef);
        console.log("Suttas.getIdbSuttaRef()", {idbKey, vueRef});
      } else {
        //console.log("Suttas.getIdbSuttaRef() found", {idbKey, idbSutta});
      }

      return vueRef;
    },
    async postIdbSuttaRef(opts) {// get/post API
      let idbKey = IdbSutta.idbKey(opts);
      let vueRef = VUEREFS.get(idbKey);
      let idbSutta = vueRef?.value;

      if (idbSutta == null) {
        idbSutta = IdbSutta.create(opts);
        vueRef = await this.saveIdbSutta(idbSutta);
      } else {
        idbSutta.merge({mlDoc:opts});
        vueRef = await this.saveIdbSutta(idbSutta);
      }

      return vueRef;
    },
  },
  getters: {
  },
})

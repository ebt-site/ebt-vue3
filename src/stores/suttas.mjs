import { defineStore } from 'pinia';
import { logger } from 'log-instance/index.mjs';
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
      let search = `${sutta_uid}/${lang}`;
      author && (search += `/${author}`);
      let url =  [ 
        serverUrl, 
        'search', 
        encodeURIComponent(search), 
        lang === 'pli' ? langTrans : lang,
      ].join('/'); 
      return url;
    },
    async loadIdbSutta(suttaRef, opts={}) { // low-level API
      const msg = `suttas.loadIdbSutta(${suttaRef})`;
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
        if (mlDocs.length < 1) {
          let msg = `sutta not found: ${url}`;
          volatile.alert(msg);
          return null;
        }
        idbSutta = IdbSutta.create(mlDocs[0]);
        logger.info(`suttas.loadIdbSutta()`,
          url,
          '=>',
          `segments:${idbSutta.segments.length}`,
          );
        await this.saveIdbSutta(idbSutta);
      } else {
        logger.debug(`suttas.loadIdbSutta() idb(${idbKey})`);
        idbSutta = IdbSutta.create(idbData);
      } 

      return idbSutta;
    },
    async saveIdbSutta(idbSutta) { // low-level API
      let { idbKey } = idbSutta;
      let vueRef = VUEREFS.get(idbKey);
      if (vueRef == null) {
        vueRef = ref(idbSutta);
        VUEREFS.set(idbKey, vueRef);
        idbSutta.saved = Date.now();
        logger.info(`suttas.saveIdbSutta() ADD`, idbKey, idbSutta.saved);
      } else if (vueRef.value !== idbSutta) {
        vueRef.value = idbSutta;
        idbSutta.saved = Date.now();
        logger.info(`suttas.saveIdbSutta() UPDATE`, idbKey, idbSutta.saved);
      }
      await Idb.set(idbKey, idbSutta);
      this.nSet++;
      return vueRef;
    },
    async getIdbSuttaRef(suttaRef, opts={refresh:true}) { // get/post API
      const msg = `suttas.getIdbSuttaRef(${suttaRef})`;
      try {
        let idbKey = IdbSutta.idbKey(suttaRef);
        let vueRef = VUEREFS.get(idbKey);
        let idbSutta = vueRef?.value;

        if (idbSutta == null) {
          if (!opts.refresh) {
            return null;
          }
          let promise = this.loadIdbSutta(suttaRef);
          vueRef = ref(promise);
          VUEREFS.set(idbKey, vueRef);

          idbSutta = await this.loadIdbSutta(suttaRef);
          vueRef.value = idbSutta;
          VUEREFS.set(idbKey, vueRef);
        } else {
          if (vueRef.value instanceof Promise) {
            vueRef.value = await vueRef.value;
          }
          //console.log("Suttas.getIdbSuttaRef() found", {idbKey, idbSutta});
        }

        return vueRef;
      } catch(e) {
        logger.warn(e);
        throw e;
      }
    },
  },
  getters: {
  },
})

import { defineStore } from 'pinia';
import { logger } from 'log-instance';
import Utils from "../utils.mjs";
import { SuttaRef } from 'scv-esm/main.mjs';
import { useSettingsStore } from './settings.mjs';
import { useVolatileStore } from './volatile.mjs';
import { default as IdbSutta } from '../idb-sutta.mjs';
import * as Idb from 'idb-keyval';

const MSDAY = 24 * 3600 * 1000;

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
    async loadIdbSutta(suttaRef, opts={}) {
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
        let json = await volatile.fetchJson(url);;
        this.nFetch++;
        let { mlDocs, results } = json;
        idbSutta = IdbSutta.create(mlDocs[0]);
        logger.debug(`suttas.loadIdbSutta()`,
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
    async saveIdbSutta(idbSutta) {
      let { idbKey } = idbSutta;
      idbSutta.saved = Date.now();
      logger.debug(`suttas.saveIdbSutta()`, idbSutta.saved);
      await Idb.set(idbKey, idbSutta);
      this.nSet++;
      return idbSutta;
    },
  },
  getters: {
  },
})

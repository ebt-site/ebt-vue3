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
const SAMPLE_RATE = 48000;
const INITIAL_STATE = {
  alertMsg: ref(null),
  showAlertMsg: ref(false),
  waiting: 0,
  waitingMsg: ref('...'),
  waitingDelay: ref(500),
  showWaiting: ref(false),
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
    alert(eOrMsg, context) {
      let msg = eOrMsg;
      if (msg instanceof Error) {
        msg = eOrMsg.message;
        console.warn('volatile.alert()', eOrMsg);
      }
      msg && console.trace(`volatile.alert() ${msg} ${context}`);
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

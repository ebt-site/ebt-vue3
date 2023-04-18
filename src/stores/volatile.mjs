import { defineStore } from 'pinia'
import { SuttaRef } from "scv-esm/main.mjs";
import { default as EbtCard } from "../ebt-card.mjs";
import { logger } from "log-instance";
import { ref, nextTick } from "vue";
import { useSettingsStore } from "./settings.mjs";
import Utils from "../utils.mjs";
import * as Idb from "idb-keyval";

const suttas = new Map();
const layout = ref();
const showSettings = ref(false);
const SAMPLE_RATE = 48000;
const ICON_DOWNLOAD = 'mdi-wan';
const ICON_PROCESSING = 'mdi-factory';
const INITIAL_STATE = {
  $t: t=>t,
  alertMsg: ref(null),
  showAlertMsg: ref(false),
  waiting: 0,
  waitingMsg: ref('...'),
  waitingIcon: ref(ICON_DOWNLOAD),
  waitingDelay: ref(500),
  showWaiting: ref(false),
  delayedWaiting: 0,
  suttas,
  showSettings,
  btnSettings: ref(undefined),
  routeCard: ref(undefined),
  ebtChips: ref(undefined),
};

export const useVolatileStore = defineStore('volatile', {
  state: () => {
    let s = Object.assign({}, INITIAL_STATE);
    logger.debug(`volatile.state() => `, s);
    return s;
  },
  getters: {
    iconProcessing() {
      return ICON_PROCESSING;
    },
    iconLoading() {
      return ICON_LOADING;
    },
    audioCard() {
      let { routeCard } = this;
      return routeCard?.context === EbtCard.CONTEXT_SUTTA ? routeCard : null;
    },
    layout() {
      let root = document?.documentElement;
      if (root) {
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
      } else {
        layout.value = {
          w:  375,
          h: 667,
        }
      }
      return layout;
    },
  },
  actions: {
    setRoute(cardOrRoute='#/home') {
      const msg = 'volatile.setRoute() ';
      let settings = useSettingsStore();
      let isCard = !(typeof cardOrRoute === 'string');
      let route = isCard ? cardOrRoute.routeHash() : cardOrRoute;
      let card = isCard ? cardOrRoute : settings.pathToCard(route);

      const { window } = globalThis;
      if (window == null) {
        console.trace(msg, 'DBG0418', 'no window');
      } else if (window.location.hash !== route) {
        let { document } = globalThis;
        let activeElement = document?.activeElement;
        window.location.hash = route;
        let expected = activeElement;
        let actual = document?.activeElement;
        if (expected !== actual) {
          console.trace(msg, 'DBG0418', `activeElement`, {expected, actual});
        }
      }

      this.routeCard = card;
      return card;
    },
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
    waitBegin(msg, icon=ICON_DOWNLOAD) {
      let { $t } = this;
      msg && (this.waitingMsg = $t(msg));
      this.waitingIcon = icon;
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
      logger.debug("volatile.addMlDoc", {key, mld});
      suttas[key] = mld;
    },
    mlDocFromSuttaRef(suttaRefArg) {
      let suttaRef = SuttaRef.create(suttaRefArg);
      let key = suttaRef.toString();
      return suttas[key];
    },
    async fetch(url, options={}) {
      const msg = `volatile.fetch() ${url} `;
      let res;
      try {
        this.waitBegin();
        logger.debug(msg);
        let fetchOpts = Object.assign({
    //      mode: 'no-cors',
        }, options);
        res = await fetch(url, fetchOpts);
        logger.debug(msg,  res);
      } catch(e) {
        logger.error(msg + "ERROR:", res, e);
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

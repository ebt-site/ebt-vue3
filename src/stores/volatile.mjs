import { defineStore } from 'pinia'
import { SuttaRef } from "scv-esm/main.mjs";
import { default as EbtCard } from "../ebt-card.mjs";
import { logger } from "log-instance";
import { ref, nextTick } from "vue";
import { useSettingsStore } from "./settings.mjs";
import Utils from "../utils.mjs";
import * as Idb from "idb-keyval";

const suttas = new Map();
const displayBox = ref();
const showSettings = ref(false);
const SAMPLE_RATE = 48000;
const ICON_DOWNLOAD = 'mdi-wan';
const ICON_PROCESSING = 'mdi-factory';
const INITIAL_STATE = {
  $t: t=>t,
  alertMsg: ref(null),
  alertHtml: ref("hello<br>there"),
  config: ref(undefined),
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
  homeHtml: ref('loading...'),
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
    displayBox() {
      let root = document?.documentElement;
      if (root) {
        let onresize = ()=>{
          displayBox.value = {
            w: root.clientWidth,
            h: root.clientHeight,
          }
        }
        if (displayBox.value == null) {
          document.defaultView.onresize = onresize;
          onresize();
        }
      } else {
        displayBox.value = {
          w:  375,
          h: 667,
        }
      }
      return displayBox;
    },
  },
  actions: {
    setRoute(cardOrRoute, keepFocus) {
      const msg = 'volatile.setRoute() ';
      let { config } = this;
      let settings = useSettingsStore();
      cardOrRoute = cardOrRoute || config?.homePath;
      if (!cardOrRoute) {
        console.trace(msg, 'ERROR: cardOrRoute is required');
        return;
      }
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
          if (keepFocus) {
            activeElement.focus(); // Why do we need to do this?
          } else {
            console.trace(msg, 'DBG0418', `activeElement`, {expected, actual, route});
          }
        }
      }

      this.routeCard = card;
      return card;
    },
    async fetchHomeHtml(wikiPath) {
      const msg = 'volatile.fetchHomeHtml() ';
      let { config } = this;
      let configJson = JSON.stringify(config, null, 2);
      let alertMsg = 'ebt.cannotLoadWikiHtml';
      let alertHtml = [
        '<pre>',
        'href:',
        `config: ${configJson}`,
        '</pre>',
      ];
      let html = "loading...";
      if (config) {
        let href = `${config.basePath}content/${wikiPath}.html`
        let res;
        res = await fetch(href);
        if (res.ok) {
          html = await res.text();
          logger.info(msg, {wikiPath, href, res});
        } else {
          alertHtml[1] += `<b>${href}</b>`;
          this.alert(msg, alertMsg, alertHtml.join('\n'));
          logger.error(msg, {wikiPath, href});
        }
      }
      this.homeHtml = html;
      return html;
    },
    alert(eOrMsg, context, alertHtml="") {
      let msg = eOrMsg;
      if (msg instanceof Error) {
        msg = eOrMsg.message;
        console.warn('volatile.alert()', eOrMsg);
      }
      msg && console.trace(`volatile.alert() ${msg} ${context}`);
      this.alertMsg = msg && { msg, context };
      this.alertHtml = alertHtml;
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

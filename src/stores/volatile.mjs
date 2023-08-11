import { defineStore } from 'pinia'
import { SuttaRef } from "scv-esm/main.mjs";
import { default as EbtCard } from "../ebt-card.mjs";
import { logger } from "log-instance/index.mjs";
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
  debugText: ref('debugText:'),
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
    setRoute(cardOrRoute, keepFocus, caller) {
      const msg = 'volatile.setRoute() ';
      let { config, } = this;
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
        this.debugText += `${msg}-${caller}-${route}`;
        //console.trace(msg, cardOrRoute);
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
    async fetchText(href) {
      const msg = "volatile.fetchText() ";
      let res = await fetch(href);
      let text;
      if (res.ok) {
        text = await res.text();
        //console.trace(msg, 'ok', {href});
        logger.info(msg, `${href} => OK`);
      } else {
        //console.trace(msg, 'error', {href, res});
        logger.warn(msg, `Could not fetch URL`, href);
      }
      return text;
    },
    contentPath(wikiPath) {
      let { config={} } = this;
      wikiPath = wikiPath.replace(/\/?#?\/?wiki\//, '');
      return `${config.basePath}content/${wikiPath}.html`;
    },
    async fetchWikiHtml(location, caller) {
      const msg = 'volatile.fetchWikiHtml() ';
      let { config } = this;
      let { homePath } = config;
      let hashPath = window?.location?.hash || 'homePath';
      let locationPath = location.join('/');

      let html = '';
      let paths = [
        hashPath, 
        locationPath, 
      ].filter(p=>!!p);
      let hrefs = paths.map(p => this.contentPath(p));
      let hrefMap = hrefs.reduce((a,hr,i) => { a[hr] = i; return a; }, {});
      hrefs = Object.keys(hrefMap); // unique hrefs
      //console.log(msg, hrefs);

      for (let i=0; !html && i < hrefs.length; i++) {
        let href = hrefs[i];
        html = await this.fetchText(href);
        //console.trace(msg, caller, href, !!html);
      }

      if (!html) {
        let { $t } = this;
        let alertMsg = $t('ebt.cannotLoadWikiHtml');
        logger.warn(msg, alertMsg, hrefs);
        html = [
          `<h2>${alertMsg}</h2>`,
          '<pre>',
          ...hrefs,
          '</pre>',
        ].join('\n');
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
    waitBegin(msgKey, icon=ICON_DOWNLOAD, context='') {
      let { $t } = this;
      msgKey && (this.waitingMsg = $t(msgKey));
      this.waitingIcon = icon;
      this.waitingContext = context;
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

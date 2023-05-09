import { nextTick } from "vue";
import { defineStore } from 'pinia';
import { logger } from 'log-instance';
import Utils from "../utils.mjs";
import { SuttaRef } from 'scv-esm/main.mjs';
import { default as Settings } from "../ebt-settings.mjs";
import { default as EbtCard } from "../ebt-card.mjs";
import * as Idb from "idb-keyval"; 

const SETTINGS_KEY = "settings";

var id = 1;

function elementInViewport(elt, root = document.documentElement) {
  const rect = elt?.getBoundingClientRect();
  const { window } = globalThis;
  if (window == null) {
    return false;
  }
  const viewBottom = (window.innerHeight || root.clientHeight);
  const viewRight = (window.innerWidth || root.clientWidth);

  if (!rect) {
    return false;
  }
  if (rect.bottom < 0) {
    return false;
  }
  if (rect.right < 0) {
    return false;
  }
  if (rect.top > viewBottom/2) { // show in top half of viewport
    return false;
  }
  if (rect.left > viewRight) {
    return false;
  }

  return true;
}

export const useSettingsStore = defineStore('settings', {
  state: () => {
    const msg = 'settings.useSettingsStore() ';
    let settings = Utils.assignTyped({loaded:false}, Settings.INITIAL_STATE);
    return settings;
  },
  actions: {
    async loadSettings() {
      let msg = 'settings.loadSettings() ';
      if (this.loaded) {
        return this;
      }
      let state = Utils.assignTyped({}, Settings.INITIAL_STATE);
      let savedState = await Idb.get(SETTINGS_KEY);
      if (savedState) {
        try {
          let { cards, logLevel } = savedState;
          logger.logLevel = logLevel;
          if (cards == null) {
            cards = savedState.cards = [{context:'home'}];
          }
          cards.forEach((card,i) => {
            cards[i] = new EbtCard(card);
          });
        } catch(e) {
          logger.warn(`SettingsStore.loadSettings()`, savedState, e.message);
          savedState = null;
        }
      }
      if (savedState) {
        Utils.assignTyped(this, savedState, Settings.INITIAL_STATE);
      }
      logger.info(msg, 'loaded');
      this.loaded = true;
      return this;
    },
    pathToCard(fullPath) {
      const msg = `settings.pathToCard(${fullPath}) `;
      let { cards } = this;
      let card = EbtCard.pathToCard({
        path:fullPath, 
        cards, 
        defaultLang: this.langTrans,
        addCard: (opts) => this.addCard(opts),
      });
      if (card) {
        logger.debug(msg, card.context, card.id, );
      } else { // should never happen
        logger.warn(msg+"=> null", {card, fullPath, cards});
      }
      return card;
    },
    saveSettings() {
      let saved = Utils.assignTyped({}, this, Settings.INITIAL_STATE);
      logger.logLevel = saved.logLevel;
      let json = JSON.stringify(saved);
      Idb.set(SETTINGS_KEY, JSON.parse(json));
      logger.debug("SettingsStore.saveSettings()");
    },
    removeCard(card, config) {
      const msg = "settings.removeCard() ";
      const { window } = globalThis;
      if (window == null) {
        console.trace(msg, "no window");
        return;
      }
      if (config == null) {
        console.trace(msg, "no config");
        return;
      }
      let { cards, langTrans:defaultLang } = this;
      let path = window.location.hash;
      cards = this.cards = cards.filter(c => c !== card);
      if (card.matchPath({path, defaultLang})) {
        let openCard = cards.filter(c => c.isOpen)[0];
        window.location.hash = openCard ? openCard.routeHash() : config.homePath;
      }
    },
    addCard(opts) {
      let { cards, langTrans } = this;
      let { context, location } = opts;
      let card = null;
      switch (context) {
        case EbtCard.CONTEXT_DEBUG:
        case EbtCard.CONTEXT_SEARCH:
        case EbtCard.CONTEXT_SUTTA:
        case EbtCard.CONTEXT_HOME:
          logger.info("addCard", {context, location, langTrans});
          card = new EbtCard(Object.assign({langTrans}, opts));
          this.cards.push(card);
          this.saveSettings();
          break;
        default:
          logger.info(`addCard => null [INVALID CONTEXT]`, opts);
          break;
      }
      return card;
    },
    moveCard(srcIndex, dstIndex) {
      let { cards } = this;
      let srcCard = cards[srcIndex];
      cards.splice(srcIndex, 1);
      cards.splice(dstIndex, 0, srcCard);
    },
    async scrollToElementId(idShow, idScroll) {
      const msg = 'settings.scrollToElementId() ';
      let eltShow = document.getElementById(idShow);
      let eltScroll = idScroll ? document.getElementById(idScroll) : eltShow;
      let dbg = 0;
      if (eltShow == null) {
        dbg && console.log(msg, `DBG1 (${idShow}) no element`);
        return false;
      }
      if (eltScroll == null) {
        dbg && console.log(msg, `DBG2 (${idScroll}) no scroll element`);
        return false;
      }
      let idShowInView = elementInViewport(eltShow);
      let idScrollInView = eltShow === eltScroll
        ? idShowInView
        : elementInViewport(eltScroll);
      if (idShowInView && idScrollInView) {
        dbg && console.log(msg, `DBG3 no scroll`, 
          {eltShow, idShow, idScroll} );
        return false; // element already visible (no scrolling)
      }

      dbg && console.log(msg, `DBG4 (${idShow}) scrolling to`, 
        {eltScroll, idShow, idScroll, idShowInView, idScrollInView});
      setTimeout(()=>{ // scroll after Vue is done refreshing
        eltScroll.scrollIntoView({
          block: "start",
          behavior: "smooth",
        });
      }, 300);
      return true; // element originally not in viewport
    },
    clear() {
      delete localStorage.settings; // legacy
      Utils.assignTyped(this, Settings.INITIAL_STATE);
      this.saveSettings();
      logger.debug(`SettingsStore.clear()`, this);
    },
    openCard(card) {
      if (card.IsOpen) {
        return false;
      }
      card.isOpen = true;
      return true;
    },
    async scrollToCard(card) {
      if (this.openCard(card)) {
        await new Promise(resolve => setTimeout(()=>resolve(), 100));
      }

      let curId = card.currentElementId;
      let topId = card.topAnchor;
      let scrolled = false;
      if (curId === card.titleAnchor) {
        scrolled = await this.scrollToElementId(curId, topId);
        logger.debug("[1]scrollToCard()", {curId, topId, scrolled});
        return scrolled;
      } 

      scrolled = await this.scrollToElementId(curId);
      if (scrolled) {
        logger.debug("[2]scrollToCard()", {curId, scrolled});
      } else {
        logger.debug("[3]scrollToCard()", {curId, scrolled});
      }
      return scrolled;
    },
  },
  getters: {
    development(state) {
      let { logLevel } = state;
      return logLevel === 'debug' || logLevel === 'info';
    },
    cardsOpen: (state)=>{
      let { cards } = state;
      return cards.reduce((a,v)=> (v.isOpen ? a+1: a), 0);
    },
    servers: (state)=>{ 
      let { window } = globalThis;
      let isDev = window && window.location.host.startsWith('localhost');
      let servers = Settings.SERVERS.filter(svr => !svr.dev || isDev);
      return servers;
    },
    server: (state)=>{
      return state.servers.reduce((a,v) => {
        return v.value === state.serverUrl ? v : a;
      }, "unknown");
    },
  },

})

import { nextTick } from "vue";
import { defineStore } from 'pinia';
import { logger } from 'log-instance';
import Utils from "../utils.mjs";
import { SuttaRef } from 'scv-esm/main.mjs';
import { default as Settings } from "../../src/ebt-settings.mjs";
import { default as EbtCard } from "../../src/ebt-card.mjs";

var id = 1;

function elementInViewport(elt, root = document.documentElement) {
  const rect = elt?.getBoundingClientRect();
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
  if (rect.top > viewBottom) {
    return false;
  }
  if (rect.left > viewRight) {
    return false;
  }

  return true;
}

export const useSettingsStore = defineStore('settings', {
  state: () => {
    let s = Object.assign({}, Settings.INITIAL_STATE);
    s.id = id++;
    let savedState = localStorage.settings;
    if (savedState) {
      try {
        savedState = JSON.parse(savedState);
        let { cards, logLevel } = savedState;
        logger.logLevel = logLevel;
        if (cards == null) {
          cards = savedState.cards = [{}];
        }
        cards.forEach((card,i) => {
          cards[i] = new EbtCard(card);
        });
      } catch(e) {
        logger.error(`SettingsStore.state() corrupt localStorage`, 
          savedState, e.message);
        savedState = null;
      }
    }
    if (savedState) {
      Utils.assignTyped(s, savedState, Settings.INITIAL_STATE);
      s.cards = savedState.cards;
    }
    logger.debug(`SettingsStore.state() => `, s);
    return s;
  },
  actions: {
    saveSettings() {
      let saved = Utils.assignTyped({}, this, Settings.INITIAL_STATE);
      saved.cards = this.cards;
      logger.logLevel = saved.logLevel;
      let json = JSON.stringify(saved);
      localStorage.settings = json;
      logger.debug("SettingsStore.saveSettings() localStorage.settings");
    },
    removeCard(card) {
      this.cards = this.cards.filter(c => c !== card);
    },
    addCard(opts) {
      let { cards, langTrans } = this;
      let { context, location } = opts;
      switch (context) {
        case EbtCard.CONTEXT_SEARCH:
        case EbtCard.CONTEXT_SUTTA:
        case EbtCard.CONTEXT_HOME:
        case EbtCard.CONTEXT_WIKI:
          logger.info("addCard", {context, location, langTrans});
          let card = new EbtCard(Object.assign({langTrans}, opts));
          this.cards.push(card);
          return card;
        default:
          logger.info("addCard => null [INVALID CONTEXT]", opts);
          return null;
      }
    },
    moveCard(srcIndex, dstIndex) {
      let { cards } = this;
      let srcCard = cards[srcIndex];
      cards.splice(srcIndex, 1);
      cards.splice(dstIndex, 0, srcCard);
    },
    async scrollToElementId(idShow, idScroll) {
      let eltShow = document.getElementById(idShow);
      let eltScroll = idScroll ? document.getElementById(idScroll) : eltShow;
      if (eltShow == null) {
        logger.debug(`[1]settings.scrollToElementId(${idShow}) no element`);
        return false;
      }
      if (eltScroll == null) {
        logger.debug(`[2]settings.scrollToElementId(${idScroll}) no scroll element`);
        return false;
      }
      let idShowInView = elementInViewport(eltShow);
      let idScrollInView = elementInViewport(eltScroll);
      if (idShowInView && idScrollInView) {
        logger.debug(`[3]settings.scrollToElementId(${idShow}) no scroll`, 
          {eltShow, idShowInView, idScrollInView} );
        return false; // element already visible (no scrolling)
      }

      logger.debug(`[4]settings.scrollToElementId(${idShow}) scrolling to`, 
        {eltScroll, idShowInView, idScrollInView});
      await eltScroll.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
      return true; // element originally not in viewport
    },
    clear() {
      delete localStorage.settings;
      Utils.assignTyped(this, Settings.INITIAL_STATE);
      logger.debug(`SettingsStore.clear()`, this);
    },
    suttaUrl(idOrRef) {
      let suttaRef = SuttaRef.create(idOrRef, this.langTrans);
      let { sutta_uid, lang, author, segnum } = suttaRef;
      let search = `${sutta_uid}/${lang}/${author}`;
      let { serverUrl } = this;
      return [ 
        serverUrl, 
        'search', 
        encodeURIComponent(search), 
        lang,
      ].join('/');
    },
    async fetchSutta(suttaRef) {
      let url = this.suttaUrl(suttaRef);
      logger.info("volatile.fetchSutta()", {suttaRef, url});
      let sutta;
      return sutta;
    },
    async scrollToCard(card) {
      if (!card.isOpen) {
        return false;
      }

      let eltId = card.currentElementId;
      if (eltId === card.titleAnchor) {
        let scrollId = card.topAnchor;
        let scrolled = this.scrollToElementId(eltId, scrollId);
        return scrolled;
      } 

      let scrolled = this.scrollToElementId(eltId);
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
      let isDev = window.location.host.startsWith('localhost');;
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

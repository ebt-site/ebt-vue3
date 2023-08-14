<template>
  <v-sheet id="ebt-cards" 
    color="background" :class="cardsClass" 
  >
    <div v-for="card in settings.cards">
      <ebt-card-vue 
        :card="card" 
        :routeCard="volatile.routeCard"
        @focusin="onFocusIn(card)"
      />
    </div><!-- v-for card -->
    <sutta-player :routeCard="volatile.routeCard" />
  </v-sheet>
</template>

<script>
  import { ref, nextTick } from "vue";
  import { SuttaRef } from 'scv-esm';
  import { default as HomeView } from './HomeView.vue';
  import { default as EbtCard } from '../ebt-card.mjs';
  import { default as EbtCardVue } from './EbtCard.vue';
  import { default as SuttaPlayer } from './SuttaPlayer.vue';
  import { useVolatileStore } from '../stores/volatile.mjs';
  import { useSuttasStore } from '../stores/suttas.mjs';
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useAudioStore } from '../stores/audio.mjs';
  import { logger } from "log-instance/index.mjs";

  export default {
    setup() {
      return {
        audio: useAudioStore(),
        suttas: useSuttasStore(),
        settings: useSettingsStore(),
        volatile: useVolatileStore(),
      }
    },
    mounted() {
      let msg = 'EbtCards.mounted() ';
      let { settings, volatile, $route }  = this;

      let { params, path='/home' }  = $route;
      let { cards } = settings;
      if (path === "/" ) {
        path = "/home"
      }
      let card = settings.pathToCard(path);

      logger.info(msg, this, card);

      if (card == null) {
        logger.warn(msg+"UNEXPECTED", {$route, path});
      } else {
        let { activeElement } = document;
        volatile.setRoute(card, true, msg);
        nextTick(() => {
          volatile.setRoute(card, true);
          settings.scrollToCard(card);
          this.bindAudioSutta(window.location.hash);
          //console.log(msg, {card, activeElement});
        });
      }
    },
    methods: {
      onFocusIn(card) {
        const msg = "EbtCards.onFocusIn() ";
        let { volatile, settings } = this;
        let { cards } = settings;
        let { context, location } = card;
        let routeHash = window.location.hash;
        let routeCard = EbtCard.pathToCard({
          path: routeHash,
          cards, 
          addCard: (opts) => {},
          defaultLang: settings.langTrans,
        });
        if (routeCard !== card) {
          volatile.setRoute(card.routeHash(), true, msg);
        }
      },
      async bindAudioSutta(route) {
        let { volatile, suttas, audio, settings, } = this;
        let { routeCard } = volatile;
        if (routeCard?.context === EbtCard.CONTEXT_SUTTA) {
          let suttaRef = EbtCard.routeSuttaRef(route, settings.langTrans);
          let idbSuttaRef = await suttas.getIdbSuttaRef(suttaRef);
          let idbSutta = idbSuttaRef.value;
          let { sutta_uid, segnum } = suttaRef;
          let { segments } = idbSutta;
          let incRes = routeCard.incrementLocation({segments, delta:0});
          let { iSegment=0 } = incRes || {};
          audio.setAudioSutta(idbSutta, iSegment);
        } else {
          audio.setAudioSutta(null);
        }
      },
      routeScid(route) {
        let { sutta_uid, segnum } = this.routeSuttaRef(route);
        return segnum ? `${sutta_uid}:${segnum}` : sutta_uid;
      },
    },
    computed: {
      cardsClass(ctx) {
        let { settings } = ctx;
        return settings.cardsOpen === 1 
          ? "ebt-cards ebt-cards1" 
          : "ebt-cards";
      },
    },
    watch:{
      $route (to, from) {
        const msg = 'EbtCards.watch.$route';
        let { volatile, settings, $route }  = this;
        let { cards } = settings;
        let card = EbtCard.pathToCard({
          path: to.fullPath, 
          cards, 
          addCard: (opts) => settings.addCard(opts),
          defaultLang: settings.langTrans,
        });
        let { activeElement } = document;
        //console.log(msg, 'before setRoute', { activeElement, to, from});
        volatile.setRoute(card, undefined, msg);
        //console.log(msg, 'after setRoute', document.activeElement);
        this.bindAudioSutta(to.href);
        if (card == null) {
          volatile.setRoute('', undefined, msg);
          logger.warn(`${msg} => non-card route`, {$route, to, from});
          return;
        }

        if (card.isOpen) {
          logger.debug(`${msg} => card`, {$route, to, from, card});
        } else {
          card.isOpen = true;
          logger.info(`${msg} => opened card`, {$route, to, from, card});
        }
        if (card.context === EbtCard.CONTEXT_WIKI) {
          volatile.fetchWikiHtml(card.location, msg);
        }
        nextTick(() => { 
      //TODO    settings.scrollToCard(card); 
          logger.debug(msg, document.activeElement, volatile.routeCard);
        })
      }
    }, 
    components: {
      HomeView,
      EbtCardVue,
      SuttaPlayer,
    },
  }
</script>
<style scoped>
  .ebt-cards {
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    min-height: 50em;
    padding-bottom: calc(80vw);
  }
  .ebt-cards1 {
    background-color: rgb(var(--v-theme-surface)) !important;
  }
  .play-col {
    display: flex;
    flex-flow: column nowrap;
  }
  .play-row {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    align-items: center;
    opacity: 1;
  }
  .play-row button {
    padding: 0;
    min-width: 48px;
    max-width: 54px;
  }
  .play-scid {
    display: flex;
    flex-flow: column;
    align-items: center;
    font-family: var(--ebt-sc-sans-font);
    font-size: larger;
    font-weight: 600;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
  .progressTime {
    font-weight: 400;
  }
</style>

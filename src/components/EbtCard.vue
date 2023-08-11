<template>
<Transition>
  <v-sheet v-if="card.isOpen " :class="cardSheetClass"
    @focusin="onFocusIn"
    @click="onClickCard"
  >
    <div :id="`${card.topAnchor}`" class="card-top-anchor debug">
      {{card.topAnchor}}
    </div>
    <div :class="cardClass">
      <v-card :id="card.id" variant="flat" >
        <template v-slot:title>
          <v-icon class="card-icon" :title="`${card.id}`">
            {{card.icon}}
          </v-icon>
          <span :id="card.titleAnchor">{{card.chipTitle($t)}}</span>
        </template>
        <template v-slot:append>
          <v-btn icon="mdi-window-minimize" flat 
            :id="card.tab1Id"
            @click="clickMinimize"
            @focus="focusTop"
            @keydown.shift.tab.exact.prevent="onBackTabOut"
          />
          <v-btn icon="mdi-close-thick" flat 
            v-if="isClosable"
            @click="clickDelete"
            @focus="focusTop"
          />
        </template>
        <v-card-text>
          <debug-view :card="card" v-if="card.context===CONTEXT_DEBUG"/>
          <template v-if="volatile.config">
            <home-view v-if="card.context===CONTEXT_WIKI" :card="card" />
          </template>
          <search-view :card="card" v-if="card.context===CONTEXT_SEARCH"/>
          <sutta-view v-if="card.context===CONTEXT_SUTTA && routeCard" 
            :card="card" 
            :routeCard="routeCard"
          ></sutta-view>
        </v-card-text>
        <div class="last-tab" tabindex=0 
          @click='onClickLastTab'
          @focus='onFocusLastTab'>
          <v-icon icon='mdi-keyboard-tab' />
        </div>
      </v-card>
    </div>
  </v-sheet>
</Transition>
</template>

<script>
  import { default as DebugView } from './DebugView.vue';
  import { default as HomeView } from './HomeView.vue';
  import { default as SearchView } from './SearchView.vue';
  import { default as WikiView } from './WikiView.vue';
  import { default as SuttaView } from './SuttaView.vue';
  import { default as EbtCard } from '../ebt-card.mjs';
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useVolatileStore } from '../stores/volatile.mjs';
  import { useAudioStore } from '../stores/audio.mjs';
  import { logger } from 'log-instance/index.mjs';
  import { nextTick, ref } from "vue";

  export default {
    inject: ['config'],
    props: {
      card: { type: Object, },
      routeCard: { type: Object },
    },
    setup() {
      return {
        audio: useAudioStore(),
        settings: useSettingsStore(),
        volatile: useVolatileStore(),
        observer: ref(undefined),
      }
    },
    components: {
      DebugView,
      HomeView,
      SearchView,
      SuttaView,
      WikiView,
    },
    mounted() {
      const msg = 'EbtCard.mounted() ';
      let { card, $route, settings } = this;
      let { langTrans:defaultLang } = settings;
      let { id } = card;
      this.addIntersectionObserver();
      if (card.matchPath({path:$route.fullPath, defaultLang})) {
        nextTick(() => {
          let { activeElement } = document;
          //console.log(msg, 'before focus', {$route, activeElement});
          card.focus();
          //console.log(msg, 'after focus', document.activeElement);
        });
        logger.debug(msg, "routeCard:", {id});
      } else {
        logger.debug(msg, {id});
      }
    },
    updated() {
      this.addIntersectionObserver();
    },
    methods: {
      onClickLastTab(evt) {
        const msg = 'EbtCard.onClickLastTab() ';
        console.log(msg);
      },
      onFocusLastTab(evt) {
        const msg = 'EbtCard.onFocusLastTab() ';
        let { volatile, audio } = this;
        let { ebtChips } = volatile;
        console.log(msg, ebtChips);
        ebtChips && ebtChips.focus();
        audio.playBlock();
      },
      onClickCard(evt) {
        const msg = "EbtCard.onClickCard() ";
        let { volatile, card } = this;
        volatile.setRoute(card, undefined, msg);
      },
      onBackTabOut(evt) {
        let { volatile } = this;
        volatile.ebtChips && volatile.ebtChips.focus();
      },
      onFocusIn(evt) {
        const msg = "EbtCard.onFocusIn() ";
        let { volatile, card } = this;
        let { location, id, context } = card;
        let chipTitle = card.chipTitle();
        volatile.setRoute(card, undefined, msg);
      },
      clickDelete() {
        let { card, settings, config } = this;
        this.clickMinimize();
        setTimeout(()=>{
          settings.removeCard(card, config);
        }, 500);
      },
      clickMinimize() {
        let { audio, card, settings } = this;
        audio.playClick();
        this.closeCard(card, settings);
      },
      focusTop() {
        let { settings, card } = this;
        let topId = card.topAnchor;
        settings.scrollToElementId(topId);
      },
      closeCard: (card, settings) => {
        card.isOpen = false;
        let volatile = useVolatileStore();
        let { ebtChips } = volatile;
        ebtChips && ebtChips.focus();
      },
      addIntersectionObserver() {
        let { card, observer } = this;
        let { id } = card;
        let elt = document.getElementById(card.id);
        if (!elt || this.observer) {
          return;
        }

        setTimeout(()=>{ // wait for full-size element
          let { scrollHeight } = elt;
          let callback = (entries, observer) => {
            logger.debug(`IntersectionObserver#${id}`, entries);
            card.visible = entries[0].isIntersecting;
          }
          const HEADER_HEIGHT = 104;
          const LINE_HEIGHT = 20;
          let threshold = [
            HEADER_HEIGHT+2*LINE_HEIGHT,   
          ].map(t=>Math.min(1,t/scrollHeight));
          let obsOpts = {
            root: null,
            rootMargin: "0px",
            threshold,
          }
          let observer = new IntersectionObserver(callback, obsOpts);
          this.observer = observer;
          observer.observe(elt);
          let routeHash = card.routeHash();
        }, 300);
      },
    },
    computed: {
      cardSheetClass(ctx) {
        let { card } = ctx;
        return card.isOpen
          ? 'card-sheet'
          : 'card-sheet-closed';

      },
      isClosable(ctx) {
        let { card } = ctx;
        return card.context !== EbtCard.CONTEXT_WIKI;
      },
      showDev(ctx) {
        let logLevel = ctx.settings.logLevel;

        return logLevel === 'info' || logLevel === 'debug';
      },
      cardClass(ctx) {
        let { settings, volatile, card } = ctx;
        return volatile.routeCard === card
          ? 'ebt-card ebt-card-current'
          : 'ebt-card';
      },
      cardLink: (ctx) => {
        let { card } = ctx;
        let { context, location } = card;
        context = encodeURIComponent(context);
        location = location.map(loc => encodeURIComponent(location)).join('/');
        let link = `/${context}/${location}`;
        return link;
      },
      CONTEXT_DEBUG: (ctx)=>EbtCard.CONTEXT_DEBUG,
      CONTEXT_WIKI: (ctx)=>EbtCard.CONTEXT_WIKI,
      CONTEXT_SEARCH: (ctx)=>EbtCard.CONTEXT_SEARCH,
      CONTEXT_SUTTA: (ctx)=>EbtCard.CONTEXT_SUTTA,
      contexts: (ctx) => {
        let { $t } = ctx;
        return [{
          title: $t('ebt.context-home'),
          value: EbtCard.CONTEXT_WIKI,
        },{
          title: $t('ebt.context-sutta'),
          value: EbtCard.CONTEXT_SUTTA,
        },{
          title: $t('ebt.context-search'),
          value: EbtCard.CONTEXT_SEARCH,
        },{
          title: $t('ebt.context-debug'),
          value: EbtCard.CONTEXT_DEBUG,
        }];
      },
    },
  }
</script>

<style >
  .card-top-anchor {
    font-size: 12px;
    position: relative;
    overflow: hidden;
    border-left: 1pt solid rgb(0,0,0,0);
    width: 1px;
    height: 118px;
    top: 0em;
  }
  .card-title-anchor {
    position: relative;
  }
  .card-icon {
    opacity: 0.5;
    margin-right: 0.2em;
  }
  .ebt-card {
    background: rgb(var(--v-theme-surface)) !important;
    margin-left: 2px;
    margin-right: 2px;
    border-radius: 4px;
  }
  .ebt-card-current {
    -webkit-box-shadow:0px 0px 3px 3px rgba(var(--v-theme-focus), 0.5);
    -moz-box-shadow: 0px 0px 3px 3px 1px rgba(var(--v-theme-focus), 0.5);
    box-shadow: 0px 0px 3px 3px rgba(var(--v-theme-focus), 0.5);
  }
  .ebt-card > .v-card {
    opacity: 0.5 !important;
  }
  .ebt-card-current > .v-card--variant-flat {
    opacity: 1 !important;
  }
  @media (max-width: 600px) {
    .ebt-card {
      max-width: calc(100vw - 10px);
    }
  }
  .v-card-text {
    min-width: 20em;
  }
  .close-item {
    cursor: pointer;
  }
  .close-item:hover {
    color: rgb(var(--v-theme-link));
  }
  .card-sheet {
    background: rgba(0,0,0,0);
  }
  .card-sheet-closed {
    display: none;
  }
  .last-tab {
    display: flex;
    opacity: 0.0;
    justify-content: center;
    cursor: pointer;
  }
  .last-tab:focus {
    outline: 1pt solid green;
  }
</style>


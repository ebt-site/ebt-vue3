<template>
<Transition>
  <v-sheet v-if="card.isOpen " :class="cardClass">
    <div :id="`${card.topAnchor}`" class="card-top-anchor debug">
      {{card.topAnchor}}
    </div>
    <v-card :id="card.id" :variant="cardVariant" class="ebt-card">
      <template v-slot:title>
        <v-icon :icon="card.icon" class="card-icon"/>
        <span :id="card.titleAnchor">{{card.chipTitle($t)}}</span>
      </template>
      <template v-slot:append>
        <v-btn icon="mdi-window-minimize" flat 
          @click="clickMinimize"
          @focus="focusTop"
        />
        <v-btn icon="mdi-close-thick" flat 
          v-if="isClosable"
          @click="clickDelete"
          @focus="focusTop"
        />
      </template>
      <v-card-text>
        <debug-view v-if="card.context===CONTEXT_DEBUG"/>
        <home-view :card="card" v-if="card.context===CONTEXT_HOME"/>
        <search-view :card="card" v-if="card.context===CONTEXT_SEARCH"/>
        <sutta-view v-if="card.context===CONTEXT_SUTTA && routeCard" 
          :card="card" 
          :routeCard="routeCard"
        ></sutta-view>
        <wiki-view :card="card" v-if="card.context===CONTEXT_WIKI"/>
      </v-card-text>
      <div class="debug-footer" v-if="showDev" >
        <div class="debug-icon" @click="showDebug= !showDebug">
          <v-icon icon="mdi-hammer-wrench" size="x-small" class="debug" />
        </div>
        <v-card v-if="showDebug" class="debug" >
          <div>{{card.id}}</div>
          <v-select v-model="card.context" :items="contexts"
            :label="'Context'"
            >
          </v-select>
          <v-card-text>
            <v-text-field v-model="card.location[0]"
              label="$t('ebt.location')"
            />
          </v-card-text>
        </v-card>
      </div>
    </v-card>
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
  import { logger } from 'log-instance';
  import { nextTick, ref } from "vue";

  export default {
    props: {
      card: { type: Object, },
      routeCard: { type: Object },
    },
    setup() {
      const settings = useSettingsStore();
      const volatile = useVolatileStore();
      const showDebug = ref(false);
      const observer = undefined;

      return {
        settings,
        showDebug,
        volatile,
        observer,
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
      let { card } = this;
      let { id } = card;
      logger.debug("EbtCard.mounted()", {id});
      this.addIntersectionObserver();
    },
    updated() {
      this.addIntersectionObserver();
    },
    methods: {
      clickDelete() {
        let { volatile, card, settings } = this;
        this.clickMinimize();
        setTimeout(()=>{
          settings.removeCard(card);
        }, 500);
      },
      clickMinimize() {
        let { volatile, card, settings } = this;
        volatile.playClick();
        this.closeCard(card, settings.cards);
      },
      focusTop() {
        let { settings, card } = this;
        let topId = card.topAnchor;
        settings.scrollToElementId(topId);
      },
      closeCard: (card, cards) => {
        card.isOpen = false;
        if (window.location.hash === card.routeHash()) {
          let openCard = cards.reduce((a,c)=>{
            if (c.isOpen) {
              if (!a || !a.visible && c.visible) {
                a = c;
              }
            }
            return a;
          }, null);
          if (openCard == null) {
            openCard = cards.reduce((a,c)=> a || (
              c.context === EbtCard.CONTEXT_HOME ? c : a
            ), null);
          }
          window.location.hash = openCard.routeHash();
        }
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
      cardClass(ctx) {
        let { card } = ctx;
        return card.isOpen
          ? 'card-sheet'
          : 'card-sheet-closed';

      },
      isClosable(ctx) {
        let { card } = ctx;
        return card.context !== EbtCard.CONTEXT_HOME;
      },
      showDev(ctx) {
        let logLevel = ctx.settings.logLevel;

        return logLevel === 'info' || logLevel === 'debug';
      },
      cardVariant: (ctx) => {
        let { settings } = ctx;
        return settings.cardsOpen === 1 ? "flat" : "outlined";
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
      CONTEXT_HOME: (ctx)=>EbtCard.CONTEXT_HOME,
      CONTEXT_SEARCH: (ctx)=>EbtCard.CONTEXT_SEARCH,
      CONTEXT_WIKI: (ctx)=>EbtCard.CONTEXT_WIKI,
      CONTEXT_SUTTA: (ctx)=>EbtCard.CONTEXT_SUTTA,
      contexts: (ctx) => {
        let { $t } = ctx;
        return [{
          title: $t('ebt.context-home'),
          value: EbtCard.CONTEXT_HOME,
        },{
          title: $t('ebt.context-sutta'),
          value: EbtCard.CONTEXT_SUTTA,
        },{
          title: $t('ebt.context-search'),
          value: EbtCard.CONTEXT_SEARCH,
        },{
          title: $t('ebt.context-wiki'),
          value: EbtCard.CONTEXT_WIKI,
        },{
          title: $t('ebt.context-debug'),
          value: EbtCard.CONTEXT_DEBUG,
        }];
      },
    },
  }
</script>

<style scoped>
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
  }
  .debug-icon {
    color: cyan;
    font-size: smaller;
    opacity: 0.5;
    text-align: right;
    margin-right: 1pt;
    cursor: pointer;
  }
  .debug-icon:hover {
    opacity: 1;
  }
  .debug-footer {
    font-size: smaller;
  }
  th {
    vertical-align: top;
  }
  .ebt-card {
    background: rgb(var(--v-theme-surface));
    margin-left: 2px;
    margin-right: 2px;
  }
  @media (max-width: 600px) {
    .ebt-card {
      max-width: calc(100vw - 10px);
    }
  }
  .debug {
    color: rgb(var(--v-theme-debug));
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
</style>


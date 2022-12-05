<template>
  <v-sheet id="ebt-cards" color="background" :class="cardsClass" >
    <div v-for="card in settings.cards">
      <ebt-card-vue :card="card" :routeCard="routeCard"/>
    </div><!-- v-for card -->
    <sutta-player 
      :audioSegments="audioSegments"
      :routeCard="routeCard"
      :audioScid="audioScid"
      :iSegment="iSegment"
    />
  </v-sheet>
</template>

<script>
  import { ref, nextTick } from "vue";
  import { SuttaRef } from 'scv-esm';
  import { default as EbtCard } from '../ebt-card.mjs';
  import { default as EbtCardVue } from './EbtCard.vue';
  import { default as SuttaPlayer } from './SuttaPlayer.vue';
  import { useSuttasStore } from '../stores/suttas.mjs';
  import { useSettingsStore } from '../stores/settings.mjs';
  import { logger } from "log-instance";

  export default {
    setup() {
      return {
        suttas: useSuttasStore(),
        settings: useSettingsStore(),
        audioScid: ref(undefined),
        audioSegments: ref(undefined),
        iSegment: ref(0),
        routeCard: ref(undefined),
      }
    },
    mounted() {
      let { settings, $route }  = this;
      let { params, fullPath }  = $route;
      let { cards } = settings;
      let card = EbtCard.pathToCard({
        path:fullPath, 
        cards, 
        defaultLang: settings.langTrans,
        addCard: (opts) => settings.addCard(opts),
      });

      logger.info("EbtCards.mounted", this);

      if (card == null) {
        //window.location.hash = '';
        logger.warn("EbtCards.mounted UNEXPECTED", fullPath);
      } else {
        this.routeCard = card;
        nextTick(() => {
          settings.scrollToCard(card);
          this.bindAudioSegments(window.location.hash);
        });
      }
    },
    methods: {
      routeSuttaRef(route) {
        let hashParts = route.split("/");
        if (hashParts[0] === '#') {
          hashParts.shift();
        }
        let [ context, sutta_uid, lang, author ] = hashParts;
        return context === EbtCard.CONTEXT_SUTTA
          ? SuttaRef.create({sutta_uid, lang, author})
          : null;
      },
      async bindAudioSegments(route) {
        let { routeCard, suttas } = this;
        if (routeCard?.context === EbtCard.CONTEXT_SUTTA) {
          let suttaRef = this.routeSuttaRef(route);
          let idbSutta = await suttas.loadIdbSutta(suttaRef);
          let { sutta_uid, segnum } = suttaRef;
          let { segments } = idbSutta;
          let incRes = routeCard.incrementLocation({segments, delta:0});
          let { iSegment=0 } = incRes || {};
          this.audioScid =  segments[iSegment].scid;
          this.audioSegments = segments;
          this.iSegment = iSegment;
        } else {
          this.audioScid = null;
          this.iSegment = 0;
          this.audioSegments = null;
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
        let { settings, $route }  = this;
        let { cards } = settings;
        let msg = 'EbtCards.watch.$route';
        let card = EbtCard.pathToCard({
          path: to.fullPath, 
          cards, 
          addCard: (opts) => settings.addCard(opts),
          defaultLang: settings.langTrans,
        });
        this.routeCard = card;
        this.bindAudioSegments(to.href);
        if (card == null) {
          window.location.hash = '';
          logger.warn(`${msg} => invalid card route`, {$route, to, from});
          return;
        }

        if (card.isOpen) {
          logger.debug(`${msg} => card`, {$route, to, from, card});
        } else {
          card.isOpen = true;
          logger.info(`${msg} => opened card`, {$route, to, from, card});
        }
        nextTick(() => { settings.scrollToCard(card); })
      }
    }, 
    components: {
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

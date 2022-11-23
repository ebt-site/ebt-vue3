<template>
  <v-sheet id="ebt-cards" color="background" :class="cardsClass" >
    <div v-for="card in settings.cards">
      <ebt-card-vue :card="card" />
    </div><!-- v-for card -->
    <v-bottom-navigation v-if="playScid" 
      class="play-nav" 
      hide-on-scroll
      dense
    >
      <v-btn icon>
        <v-icon icon="mdi-play-pause" />
      </v-btn>
      <div class="play-scid">
        {{playScid}}
      </div>
      <v-btn icon>
        <v-icon icon="mdi-play" />
      </v-btn>
    </v-bottom-navigation>
  </v-sheet>
</template>

<script>
  import { ref, nextTick } from "vue";
  import { default as EbtCard } from '../ebt-card.mjs';
  import { default as EbtCardVue } from './EbtCard.vue';
  import { useSettingsStore } from '../stores/settings.mjs';
  import { logger } from "log-instance";

  export default {
    setup() {
      const settings = useSettingsStore();

      return {
        settings,
        playScid: ref(undefined),
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
      this.playScid = this.routeScid(window.location.hash);

      logger.info("EbtCards.mounted", this);

      if (card == null) {
        //window.location.hash = '';
        logger.warn("EbtCards.mounted UNEXPECTED", fullPath);
      } else {
        nextTick(() => {
          settings.scrollToCard(card);
        });
      }
    },
    methods: {
      routeScid: (route) => {
        let hashParts = route.split("/");
        if (hashParts[0] === '#') {
          hashParts.shift();
        }
        let [ context, loc0, loc1, loc2 ] = hashParts;
        return context === EbtCard.CONTEXT_SUTTA ? loc0 : null;
      },
    },
    computed: {
      cardsClass: (ctx) => {
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
        this.playScid = this.routeScid(to.href);
        let card = EbtCard.pathToCard({
          path: to.fullPath, 
          cards, 
          addCard: (opts) => settings.addCard(opts),
          defaultLang: settings.langTrans,
        });
        if (card == null) {
          window.location.hash = '';
          logger.warn(`${msg} => invalid card route`, {$route, to, from});
          return;
        }

        if (card.isOpen) {
          logger.info(`${msg} => card`, {$route, to, from, card});
        } else {
          card.isOpen = true;
          logger.info(`${msg} => opened card`, {$route, to, from, card});
        }
        nextTick(() => {
          settings.scrollToCard(card);
        })
      }
    }, 
    components: {
      EbtCardVue,
    },
  }
</script>
<style scoped>
  .ebt-cards {
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    min-height: 50em;
  }
  .ebt-cards1 {
    background-color: rgb(var(--v-theme-surface)) !important;
  }
  .play-nav {
    align-items: center;
    opacity: 1;
  }
  .play-scid {
    font-family: var(--ebt-sc-sans-font);
    font-size: larger;
    font-weight: 600;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
</style>

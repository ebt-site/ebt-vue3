<template>
  <v-sheet id="ebt-cards" color="background" :class="cardsClass" >
    <div v-for="card in settings.cards">
      <ebt-card-vue :card="card" />
    </div><!-- v-for card -->
  </v-sheet>
</template>

<script>
  import { nextTick } from "vue";
  import { default as EbtCard } from '../ebt-card.mjs';
  import { default as EbtCardVue } from './EbtCard.vue';
  import { useSettingsStore } from '../stores/settings.mjs';
  import { logger } from "log-instance";

  export default {
    setup() {
      const settings = useSettingsStore();

      return {
        settings,
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

      if (card == null) {
        //window.location.hash = '';
        console.warn("DEBUG EbtCards.mounted UNEXPECTED", fullPath);

      } else {
        nextTick(() => {
          settings.scrollToCard(card);
        });
      }
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
        let card = EbtCard.pathToCard({
          path: to.fullPath, 
          cards, 
          addCard: (opts) => settings.addCard(opts),
          defaultLang: settings.langTrans,
        });
        if (card == null) {
          window.location.hash = '';
          logger.info(`${msg} => invalid card route`, {$route, to, from});
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
</style>

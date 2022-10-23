<template>
  <v-sheet color="background" :class="cardsClass" >
    <div v-for="card in settings.cards">
      <ebt-card-vue :card="card" />
    </div><!-- v-for card -->
  </v-sheet>
</template>

<script>
  import { nextTick } from "vue";
  import { default as EbtCard } from '../ebt-card.mjs';
  import { default as EbtCardVue } from './EbtCard.vue';
  import { useSettingsStore } from '../stores/settings';
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
      fullPath = decodeURIComponent(fullPath);
      let card = EbtCard.pathToCard(fullPath, cards, 
        (opts) => settings.addCard(opts));

      nextTick(() => {
        let anchor = document.getElementById(fullPath);
        logger.info(`EbtCards.mounted()`, {card, fullPath, anchor});
        anchor && anchor.scrollIntoView(true);
      });
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
      $route (to, from){
        let { settings, $route }  = this;
        let { cards } = settings;
        logger.info(`EbtCards.watch.$route()`, {$route, to, });
        let card = EbtCard.pathToCard(to.fullPath, cards, 
          (opts) => settings.addCard(opts));
        
        if (0) {
          let topAnchor = document.getElementById(card.topAnchor);
          let titleAnchor = document.getElementById(card.titleAnchor);
          topAnchor && topAnchor.scrollIntoView({
            block: "start",
            behavior: "smooth",
          });
        }
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

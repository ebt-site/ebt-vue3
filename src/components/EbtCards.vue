<template>
  <v-sheet color="background" :class="cardsClass" >
    <div v-for="card in settings.cards">
      <ebt-card-vue :card="card" />
    </div><!-- v-for card -->
  </v-sheet>
</template>

<script>
  import { default as EbtCard } from '../ebt-card.mjs';
  import { default as EbtCardVue } from './EbtCard.vue';
  import { useSettingsStore } from '../stores/settings';

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
      let card = EbtCard.pathToCard(fullPath, cards, 
        (opts) => settings.addCard(opts));
      console.log(`EbtCards.mounted()`, card);
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
        console.log(`EbtCards.watch.$route()`, {$route, to, });
        let card = EbtCard.pathToCard(to.fullPath, cards, 
          (opts) => settings.addCard(opts));
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

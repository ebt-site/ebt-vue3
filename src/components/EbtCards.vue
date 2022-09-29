<template>
  <div class="ebt-cards">
    <div v-for="card in settings.cards">
      <ebt-card-vue v-if="card.isOpen" :card="card" />
    </div><!-- v-for card -->
  </div>
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
    justify-content: space between;
  }
</style>

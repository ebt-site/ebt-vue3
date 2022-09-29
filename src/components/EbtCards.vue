<template>
  <div class="ebt-cards">
    <div v-for="card in settings.cards">
      <ebt-card-vue v-if="card.isOpen" :card="card" />
    </div><!-- v-for card -->
  </div>
</template>

<script>
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
      let card = settings.pathToCard(fullPath);
      console.log(`EbtCards.mounted()`, card);
    },
    watch:{
      $route (to, from){
        let card = settings.pathToCard(to);
        console.log(`EbtCards.watch.$route()`, card);
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

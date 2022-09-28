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
      let { $route }  = this;
      let { params, fullPath }  = $route;
      let { context, location } = params || {};
      console.log(`EbtCards.mounted()`, {context, location, fullPath});
    },
    watch:{
      $route (to, from){
        console.log("EbtCards.watch.$route", {to, from});
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

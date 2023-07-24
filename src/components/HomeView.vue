<template>
  <v-sheet class="home">
    <div v-html="volatile.homeHtml" />
  </v-sheet>
</template>

<script>
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useVolatileStore } from '../stores/volatile.mjs';
  import { logger } from 'log-instance/index.mjs';
  import { ref } from "vue";

  export default {
    inject: ['config'],
    setup() {
      return {
        settings: useSettingsStore(),
        volatile: useVolatileStore(),
      }
    },
    props: {
      card: { type: Object, required: true, },
    },
    components: {
    },
    methods: {
    },
    async mounted() {
      const msg = "HomeView.mounted() ";
      let { card, volatile } = this;
      let { location } = card;
      logger.info(msg, {location});
      await volatile.fetchHomeHtml(location.join('/'));
    },
    computed: {
    },
  }
</script>

<style scoped>
.home {
  max-width: 40em;
  margin-left: auto;
  margin-right: auto;
}
.text {
  max-width: 20em;
  margin-bottom: 1em;
}
</style>


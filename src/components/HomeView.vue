<template>
  <v-sheet class="home">
    <div v-html="volatile.homeHtml" />
  </v-sheet>
</template>

<script>
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useVolatileStore } from '../stores/volatile.mjs';
  import { logger } from 'log-instance';
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
      await volatile.fetchHomeHtml(location.join('/'));
      logger.info(msg);
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


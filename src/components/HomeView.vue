<template>
  <v-sheet class="home">
    <div>
      <h3>HOME VIEW</h3>
      <div v-html="html" />
    </div>
  </v-sheet>
</template>

<script>
  import { useSettingsStore } from '../stores/settings.mjs';
  import { ref } from "vue";

  export default {
    inject: ['config'],
    setup() {
      const settings = useSettingsStore();
      const html = ref('loading html...');
      return {
        settings,
        html,
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
      let { card, config } = this;
      let { location } = card;
      let href = `${config.basePath}content/wiki/${location.join('/')}.html`
      try {
        let res = await fetch(href);
        let html = await res.text();
        console.log(msg, {location, href, res, html});
        this.html = html;
      } catch (e) {
        logger.error(msg, {location, href, res, e});
      }
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


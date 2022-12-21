<template>
  <v-sheet class="debug-card">
    <div>
      <h3>DEBUG VIEW</h3>

      <v-btn @click="clickTestLoadSettings" variant="outlined">
        Test Load Settings
      </v-btn>

      <div style="width: 20em">
        <div v-for="link in testLinks">
          <a :href="link">{{link.replace(/#/,'')}}</a>
        </div>
      </div>
    </div>
  </v-sheet>
</template>

<script>
  import { useSettingsStore } from '../stores/settings.mjs';
  import { ref } from "vue";

  export default {
    setup() {
      const settings = useSettingsStore();
      return {
        settings,
      }
    },
    components: {
    },
    methods: {
      clickTestLoadSettings() {
        let { settings } = this;
        settings.loadSettings();
      },
    },
    mounted() {
    },
    computed: {
      testLinks: (ctx) => [
        "#/",
        "#/wiki",
        "#/sutta",
        "#/sutta/sn24.11:3.1",
        "#/sutta/mn44:0.1",
        "#/sutta/mn44:10.2",
        "#/sutta/mn44:20.1",
        "#/search",
        "#/search/DN33",
        "#/wiki/welcome",
        "#/wiki/about",
        "#/sutta/DN33",
        "#/search/root%20of%20suffering",
      ],
    },
  }
</script>

<style scoped>
.debug-card {
  max-width: 40em;
  margin-left: auto;
  margin-right: auto;
}
</style>


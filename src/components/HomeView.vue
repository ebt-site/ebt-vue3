<template>
  <v-sheet class="home">
    <div>
      <h3>HOME VIEW</h3>

      <div class="text">
        Welcome to Ebt-Vue3 (Alpha version)
      </div>
      <div class="text">
        Ebt-Vue3 is the working prototype of the next version of
        <a href="voice.suttacentral.net">voice.suttacentral.net</a>.
      </div>
      <div class="text" style="opacity:0.5">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
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
    },
    mounted() {
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


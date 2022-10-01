<template>
  <v-sheet>
    <h3>SEARCH VIEW</h3>

    <div style="width: 20em">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </div>
  </v-sheet>
</template>

<script>
  import { useSettingsStore } from '../stores/settings';
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
</style>


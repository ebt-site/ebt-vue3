<template>
  <v-sheet>
    SEARCH VIEW
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


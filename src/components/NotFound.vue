<template>
  <v-alert type="warning" closable>
    {{$t('ebt.pageNotFound')}}
    <div>{{path}}{{hash}}</div>
  </v-alert>
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
      console.log("NotFound", this.$route.params);
    },
    computed: {
      hash: (ctx)=>{
        return window.location.hash;
      },
      path: (ctx)=>{
        return window.location.pathname;
      },
    },
  }
</script>


<template>
  <v-expansion-panels v-model="panels" class="mt-2" 
  >
    <template v-for="(mld,i) in results?.mlDocs" >
      <v-expansion-panel :value="i">
        <v-expansion-panel-title
          expand-icon="mdi-dots-vertical"
          collapse-icon="mdi-dots-horizontal"
          :aria-label="mld.sutta_uid"
        >
          <v-row no-gutter>
            <v-col cols=8>
              {{i+1}}.&nbsp;<a :href="`#/sutta/${href(mld)}`">{{suttaRef(mld)}}</a>
            </v-col>
            <v-col cols=4>
              {{mldDuration(mld)}} score{{score(mld)}}
            </v-col>
          </v-row>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        </v-expansion-panel-text>
      </v-expansion-panel>
    </template>
  </v-expansion-panels>
</template>

<script>
  import { useSettingsStore } from '../stores/settings';
  import { useVolatileStore } from '../stores/volatile';
  import { default as SuttaDuration } from '../sutta-duration.mjs';
  import { ref } from "vue";

  export default {
    props: {
      results: {
        type: Object,
      },
    },
    setup() {
      const settings = useSettingsStore();
      const volatile = useVolatileStore();
      return {
        settings,
        volatile,
      }
    },
    data: () => {
      return {
        panels: [],
        suttaduration: undefind,
      }
    },
    components: {
    },
    async mounted() {
      this.suttaDuration = await new SuttaDuration({fetch}).initialize();
    },
    methods: {
      mldDuration(mld) {
        let { suttaDuration:sd } = this;
        let { sutta_uid, } = mld;
        return sd
          ? this.durationDisplay(sd.duration(mld.sutta_uid))
          : 0;
      },
      score(mld) {
        return mld.count;
      },
      suttaRef(mld) {
        return `${mld.sutta_uid}/${mld.lang}/${mld.author_uid}`;
      },
      href(mld) {
        let suttaRef = this.suttaRef(mld);
        return `#/sutta/${suttaRef}`;
      },
    },
    computed: {
    },
  }
</script>

<style scoped>
</style>

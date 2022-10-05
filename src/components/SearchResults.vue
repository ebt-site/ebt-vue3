<template>
  <v-expansion-panels v-model="panels" class="mt-2" 
  >
    <template v-for="(mld,i) in results?.mlDocs" >
      <v-expansion-panel :value="i" class="result-expansion">
        <v-expansion-panel-title
          expand-icon="mdi-dots-vertical"
          collapse-icon="mdi-dots-horizontal"
          :aria-label="mld.sutta_uid"
        >
          <div class="result-title">
            <div class="result-title-main">
              <div class="result-title-body">
                {{i+1}}.&nbsp;
                {{results.results[i].suttaplex.acronym}}
              </div> <!-- result-title-body -->
              <div class="result-title-stats">
                {{mldDuration(mld).display}}
              </div> <!-- result-title-stats -->
            </div> <!-- result-title-main -->
            <div class="result-subtitle">
              <p class="text-center">{{results.results[i].title}}</p>
            </div><!-- result-subtitle -->
          </div> <!-- result-title -->
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div>
            <a :href="`#/sutta/${href(mld)}`">
              {{results.results[i].suttaplex.acronym}}
            </a>
            {{results.results[i].suttaplex.blurb}}
          </div>
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
        suttaduration: undefined,
      }
    },
    components: {
    },
    async mounted() {
      this.suttaDuration = await new SuttaDuration({fetch}).initialize();
    },
    methods: {
      durationDisplay(totalSeconds) {
        let { $t } = this;
        totalSeconds = Math.round(totalSeconds);
        var seconds = totalSeconds;
        var hours = Math.trunc(seconds / 3600);
        seconds -= hours * 3600;
        var minutes = Math.trunc(seconds / 60);
        seconds -= minutes * 60;
        if (hours) {
            var tDisplay = $t('ebt.HHMM');
            var tAria = $t('ebt.ariaHHMM');
        } else if (minutes) {
            var tDisplay = $t('ebt.MMSS');
            var tAria = $t('ebt.ariaMMSS');
        } else {
            var tDisplay = $t('ebt.seconds');
            var tAria = $t('ebt.ariaSeconds');
        }
        var display = tDisplay
            .replace(/A_HOURS/, hours)
            .replace(/A_MINUTES/, minutes)
            .replace(/A_SECONDS/, seconds);
        var aria = tAria
            .replace(/A_HOURS/, hours)
            .replace(/A_MINUTES/, minutes)
            .replace(/A_SECONDS/, seconds);

        return {
            totalSeconds,
            hours,
            minutes,
            seconds,
            display,
            aria,
        }
      },
      mldDuration(mld) {
        let { suttaDuration:sd } = this;
        let { sutta_uid, } = mld;
        return sd
          ? this.durationDisplay(sd.duration(mld.sutta_uid))
          : 0;
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
.result-title {
  display: flex;
  flex-flow: row wrap;
  align-items: baseline;
}
.result-title-main {
  display: flex;
  flex-flow: row nowrap;
  min-width: 16rem;
  justify-content: space-between;
  margin-bottom: 0.3rem;
}
.result-subtitle {
  margin-left: 1rem;
  margin-bottom: 0.3rem;
  display: flex;
  font-size: small;
  font-style: italic;
  flex-flow: col nowrap;
  min-width: 16rem;
}
.result-title-body {
}
.result-title-stats {
}
.result-expansion {
  border-left: 3pt solid rgb(var(--v-theme-expansion));
  border-radius: 1rem;
  margin-top: 2pt;
}
</style>

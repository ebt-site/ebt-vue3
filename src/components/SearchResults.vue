<template>
  <v-expansion-panels v-model="panels" class="mt-2" 
  >
    <template v-for="(sutta,i) in matchedSuttas" >
      <v-expansion-panel :value="i" class="result-expansion">
        <v-expansion-panel-title
          expand-icon="mdi-dots-vertical"
          collapse-icon="mdi-dots-horizontal"
          :aria-label="sutta.uid"
        >
          <div class="result-title">
            <div class="result-title-main">
              <div class="result-title-number">{{i+1}}</div>
              <div class="result-title-body">
                {{card.data[i].suttaplex.acronym}}
              </div> <!-- result-title-body -->
              <div class="result-title-stats">
                {{suttaDuration(sutta)}}
              </div> <!-- result-title-stats -->
            </div> <!-- result-title-main -->
            <div class="result-subtitle">
              <p class="text-center">{{card.data[i].title}}</p>
            </div><!-- result-subtitle -->
          </div> <!-- result-title -->
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div>
            {{card.data[i].suttaplex.blurb}}
            <a :href="`#/sutta/${href(card.data[i])}`">
              <v-icon icon="mdi-open-in-new"/>
            </a>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </template>
  </v-expansion-panels>
</template>

<script>
  import { useSettingsStore } from '../stores/settings';
  import { useVolatileStore } from '../stores/volatile';
  import { SuttaRef } from 'scv-esm';
  import { ref } from "vue";

  export default {
    props: {
      card: {
        type: Object,
        required: true,
      },
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
      }
    },
    components: {
    },
    async mounted() {
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
      suttaDuration(sutta) {
        return this.durationDisplay(sutta.stats.seconds).display;
      },
      href(result) {
        let { uid:sutta_uid, lang, author_uid:author, } = result;
        let suttaRef = new SuttaRef({sutta_uid, lang, author});
        return `${suttaRef.toString()}`;
      },
    },
    computed: {
      matchedSuttas(ctx) {
        return ctx.card.data;
      },
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
  margin-left: 0.5rem;
}
.result-subtitle {
  margin-left: 0.4rem;
  margin-bottom: 0.3rem;
  display: flex;
  font-size: small;
  font-style: italic;
  min-width: 16rem;
}
.result-title-body {
}
.result-title-stats {
}
.result-expansion {
  border-left: 3pt solid rgb(var(--v-theme-expansion));
  margin-top: 2pt;
}
.result-title-number {
  position: absolute;
  font-size: x-large;
  top: 0.55em;
  left: 0.2rem;
  opacity: 0.4;
}
</style>

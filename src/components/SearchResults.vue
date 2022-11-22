<template>
  <v-expansion-panels v-model="panels" class="mt-2" 
  >
    <template v-for="(result,i) in matchedSuttas" >
      <v-expansion-panel :value="i" class="result-expansion">
        <v-expansion-panel-title
          expand-icon="mdi-dots-vertical"
          collapse-icon="mdi-dots-horizontal"
          class="expansion-panel-title"
          :aria-label="result.uid"
        >
          <div class="result-title">
            <div class="result-title-main">
              <div class="result-title-number">{{i+1}}</div>
              <div class="result-title-body">
                {{resultTitle(card.data[i])}}
              </div> <!-- result-title-body -->
              <div class="result-title-stats">
                {{suttaDuration(result)}}
              </div> <!-- result-title-stats -->
            </div> <!-- result-title-main -->
            <div class="result-subtitle" v-html="card.data[i].title">
            </div><!-- result-subtitle -->
          </div> <!-- result-title -->
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div>
            <a :href="`#/sutta/${href(card.data[i])}`" class="scv-matched">
              {{result.suttaplex.acronym}}
            </a>
            <span class="result-blurb pl-2">
              {{result.blurb || result.suttaplex.blurb}}
            </span>
          </div>
          <table>
            <tr v-for="seg in matchedSegments(result)">
              <th>
                <a :href="`#/sutta/${href(card.data[i], seg.scid)}`" 
                  class="scv-matched"
                >
                  <span>{{seg.scid}}</span>
                </a>
              </th>
              <td>
                <span v-html="seg[settings.langTrans]" />
              </td>
            </tr>
          </table>
          <div v-if="result.showMatched < result.segsMatched">
            <v-btn icon @click="showMoreSegments(result)">
              <v-icon icon="mdi-dots-horizontal"/>
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </template>
  </v-expansion-panels>
</template>

<script>
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useVolatileStore } from '../stores/volatile.mjs';
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
      matchedSegments(result) {
        return result.segments
          .filter(seg=>seg.matched)
          .slice(0,result.showMatched);
      },
      showMoreSegments(result) {
        result.showMatched = Math.min( 
          result.showMatched+3, 
          result.segsMatched, 
        );
        logger.debug("showMoreSegments", result.showMatched);
      },
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
      href(result, segnum) {
        let { uid:sutta_uid, lang, author_uid:author, } = result;
        if (segnum) {
          sutta_uid = segnum;
        }
        let suttaRef = new SuttaRef({sutta_uid, lang, author});
        return `${suttaRef.toString()}`;
      },
      resultTitle(sutta) {
        return [
          sutta.uid,
          sutta.lang,
          sutta.author_uid,
        ].join('/');
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
th {
  padding-left: 0.5rem;
  padding-right: 0.3rem;
  text-align: end;
  vertical-align: top;
}
.result-title {
  display: flex;
  flex-flow: row wrap;
  align-items: baseline;
  justify-content: space-between;
}
.result-title-main {
  display: flex;
  flex-flow: row nowrap;
  min-width: 280px;
  justify-content: space-between;
  margin-bottom: 0.3rem;
  margin-left: 0.5rem;
}
.result-subtitle {
  margin-left: 1rem;
  margin-right: 0.3rem;
  margin-bottom: 0.3rem;
  text-align: right;
  font-size: small;
  font-style: italic;
  width: 270px;
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
.result-blurb {
  font-style: italic;
  padding-bottom: 0.2em;
}
.result-quote {
  display: inline-block;
  margin-left: 0.3em;
}
.expansion-panel-title {
  cursor: zoom-in;
}
</style>

<template>
  <v-sheet :class="suttaClass">
    <div class="tipitaka-nav">
      <div>
        <v-icon icon="mdi-menu-left" />
        <a :href="`#/sutta/${prevSuid}`" v-if="prevSuid" tabindex=-1>
          {{prevSuid}}
        </a>
      </div>
      <div>
        <a :href="hrefSuttaCentral(sutta_uid)" target="_blank" tabindex=-1>
          suttacentral/{{sutta_uid}}
        </a>
      </div>
      <div>
        <a :href="`#/sutta/${nextSuid}`" v-if="nextSuid" tabindex=-1>
          {{nextSuid}}
        </a>
        <v-icon icon="mdi-menu-right" />
      </div>
    </div><!-- tipitaka-nav -->
    <div class="sutta-title">
      <div v-for="t in title"> {{t}} </div>
    </div> <!-- sutta-title -->
    <template v-if="idbSuttaRef">
      <segment-header 
        :segment="headerSeg"
        :idbSuttaRef="idbSuttaRef"
        :card="card"
        :routeCard="routeCard"
      />
    </template>
    <template v-for="seg in idbSuttaSegments">
      <segment-view 
        :segment="seg"
        :idbSuttaRef="idbSuttaRef"
        :card="card"
        :routeCard="routeCard"
      />
    </template>
  </v-sheet>
</template>

<script>
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useVolatileStore } from '../stores/volatile.mjs';
  import { useSuttasStore } from '../stores/suttas.mjs';
  import { logger } from "log-instance";
  import { Authors, Examples, Tipitaka, SuttaRef } from "scv-esm";
  import { nextTick, ref } from "vue";
  import { default as IdbSutta } from '../idb-sutta.mjs';
  import * as Idb from "idb-keyval";
  import { default as SegmentView } from './SegmentView.vue';
  import { default as SegmentHeader } from './SegmentHeader.vue';
  const EXAMPLE_TEMPLATE = IdbSutta.EXAMPLE_TEMPLATE;

  var hello = 0;

  export default {
    props: {
      card: { type: Object, required: true, },
      routeCard: { type: Object, required: true },
    },
    setup() {
      const settings = useSettingsStore();
      const volatile = useVolatileStore();
      const suttas = useSuttasStore();
      const idbSuttaRef = ref(null);
      const showTakaNav = ref(false);
      return {
        settings,
        volatile,
        suttas,
        idbSuttaRef,
        taka: new Tipitaka(),
        showTakaNav,
        logger,
      }
    },
    components: {
      SegmentView,
      SegmentHeader,
    },
    async mounted() {
      let { $route, suttas, settings, volatile, card, } = this;
      let { location, data } = card;
      let ref = {sutta_uid:location[0], lang:location[1], author:location[2]}
      let suttaRef = SuttaRef.create(ref);
      if (suttaRef == null) {
        alert(`Invalid SuttaRef ${JSON.stringify(ref)}`);
        return;
      }
      let { sutta_uid, lang, author, segnum } = suttaRef;
      let idbKey = IdbSutta.idbKey({sutta_uid, lang, author});
      let idbSuttaRef = await suttas.getIdbSuttaRef({sutta_uid, lang, author});
      let { langTrans:defaultLang } = settings;
      this.idbSuttaRef = idbSuttaRef?.value;

      logger.info('SuttaView.mounted()', {suttaRef});

      if (card.matchPath({path:$route.fullPath, defaultLang})) {
        nextTick(()=>{
          let routeHash = card.routeHash();
          settings.scrollToElementId(routeHash);
          if (window.location.hash !== routeHash) {
            logger.info(`SuttaView.mounted() route => `, 
              card.routeHash(), $route, window.location.hash);
            window.location.hash = routeHash;
          }
        });
      }
    },
    methods: {
      hrefSuttaCentral(sutta_uid) {
        return `https://suttacentral.net/${sutta_uid}`;
      },
    },
    computed: {
      idbSuttaSegments(ctx) {
        return ctx.idbSuttaRef?.segments || [];
      },
      nextSuid(ctx) {
        let { sutta_uid, taka } = ctx;
        return taka.nextSuid(sutta_uid);
      },
      prevSuid(ctx) {
        let { sutta_uid, taka } = ctx;
        return taka.previousSuid(sutta_uid);
      },
      sutta_uid(ctx) {
        let { card } = ctx;
        let suttaRef = SuttaRef.create(card.location[0]);
        if (suttaRef == null) {
          return 'sutta_uid?';
        }
        return suttaRef.sutta_uid;
      },
      currentScid(ctx) {
        let { card } = ctx;
        return card.location[0];
      },
      suttaClass(ctx) {
        let { nCols, volatile } = ctx;
        switch (nCols) {
          case 3: return "sutta-3col";
          case 2: return "sutta-2col";
          default: return "sutta-1col";
        }
      },
      nCols(ctx) {
        let { volatile, settings } = ctx;
        let { layout } = volatile;
        let w = layout.value.w;
        let nCols = 0;
        settings.showPali && nCols++;
        settings.showReference && nCols++;
        settings.showTrans && nCols++;
        settings.fullLine && (nCols = 1);
        switch (nCols) {
          case 3: 
            nCols = w < 820 ? 1 : nCols;
            break;
          case 2: 
            nCols = w < 566 ? 1 : nCols;
            break;
        }
        return nCols;
      },
      langTrans(ctx) {
        let { settings, card } = ctx;
        let { location } = card;
        return location[1] || settings.langTrans;
      },
      title(ctx) {
        let { idbSuttaRef } = ctx;
        let title = idbSuttaRef?.title || '(no-title)';
        return title.split('\n');
      },
      layout(ctx) {
        return ctx.volatile.layout.value;
      },
      takaNavIcon(ctx) {
        let { showTakaNav } = ctx;
        return showTakaNav 
          ? 'mdi-arrow-collapse-horizontal' 
          : 'mdi-arrow-expand-horizontal'
      },
      headerSeg(ctx) {
        let { $t, idbSuttaRef, settings } = ctx;
        let { refLang, showReference } = settings;
        let { author, lang  } = idbSuttaRef;
        let info = Authors.authorInfo(author);
        let refAuthor = Authors.langAuthor(refLang);
        let refInfo = Authors.authorInfo(refAuthor);
        return {
          scid: $t('ebt.author'),
          pli: 'Mahasangiti',
          [lang]: info?.name,
          [refLang]:  refInfo?.name,
        }
      },
    },
  }
</script>

<style >
.sutta {
  margin-left: auto;
  margin-right: auto;
}
.sutta-1col {
  max-width: 40em;
}
.sutta-2col {
  max-width: 60em;
}
.sutta-3col {
  max-width: 100em;
}
.sutta-title {
  display: flex;
  flex-flow: column;
  align-items: center;
  font-family: var(--ebt-sc-sans-font);
  font-size: larger;
  font-weight: 600;
  line-height: 1.5em;
  margin-bottom: 1em;
}
.sutta-title div:first-child {
  font-size: smaller;
  font-weight: 400;
}
.seg-match {
  display: flex;
  justify-content: space-between;
  border-left: 2pt solid rgba(0,0,0,0);
}
.seg-matched {
  border-left-color: rgb(var(--v-theme-matched));
}
.seg-id-col {
  flex-flow: column;
}
.seg-id-row {
  flex-flow: row;
}
.seg-id {
  font-size: x-small;
  margin-left: 10px;
}
.seg-id-col .seg-id {
  margin-left: 5px;
}
.seg-text {
  display: flex;
  flex-flow: row wrap;
  justify-content: start;
  opacity: 0.85;
}
.seg-lang {
  margin-bottom: 0.3em;
  margin-left: 10px;
}
.seg-root {
  font-style: italic;
  font-family: var(--ebt-sc-sans-font);
}
.seg-trans {
  font-family: var(--ebt-sc-sans-font);
}
.seg-ref {
  font-family: var(--ebt-sc-serif-font);
}
.seg-lang-1col-sm {
  width: 310px;
}
.seg-lang-1col-lg {
  width: 310px;
}
.seg-lang-2col-sm {
  width: 300px;
}
.seg-lang-2col-lg {
  width: 300px;
}
.seg-lang-3col-sm {
  width: 210px;
}
.seg-lang-3col-lg {
  width: 350px;
}
.seg-anchor {
  position: relative;
  font-size: 10px;
  top: -110px;
  height: 1px;
}
.seg-current {
  border: 2px dotted rgba(var(--v-theme-matched), 0.5);
  border-radius: 5px;
  font-size: larger;
}
.seg-current .seg-text {
  opacity: 1;
}
.seg-route .seg-text{
  opacity: 1;
}
.seg-route.seg-current {
  border: 2px dotted rgba(var(--v-theme-matched), 1);
}
.seg-route.seg-current .ebt-example:hover {
  cursor: pointer;
}
.tipitaka-nav {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  opacity: 0.4;
  margin-bottom: 0.5rem;
}
.tipitaka-nav:focus-within,
.tipitaka-nav:hover {
  opacity: 1;
}
</style>


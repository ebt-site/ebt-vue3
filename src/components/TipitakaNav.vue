<template>
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
      }
    },
    components: {
      SegmentView,
      SegmentHeader,
    },
    async mounted() {
    /*
      let { $route, suttas, settings, volatile, card, } = this;
      let { location, data } = card;
      let ref = {sutta_uid:location[0], lang:location[1], author:location[2]}
      let suttaRef = SuttaRef.create(ref);
      if (suttaRef == null) {
        volatile.alert(`Invalid SuttaRef ${JSON.stringify(ref)}`);
        settings.setRoute('#/home');
        settings.removeCard(card);
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
            settings.setRoute(routeHash);
          }
        });
      }
    */
    },
    methods: {
      hrefSuttaCentral(sutta_uid) {
        return `https://suttacentral.net/${sutta_uid}`;
      },
    },
    computed: {
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
      takaNavIcon(ctx) {
        let { showTakaNav } = ctx;
        return showTakaNav 
          ? 'mdi-arrow-collapse-horizontal' 
          : 'mdi-arrow-expand-horizontal'
      },
    },
  }
</script>

<style >
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


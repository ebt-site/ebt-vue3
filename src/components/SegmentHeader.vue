<template>
  <div :id="segId(segment)" class="seg-anchor" >
    <span class="debug" v-if="logger.logLevel==='debug'">
      {{segment.scid}}
    </span>
  </div>
  <div :class="segMatchedClass(segment)">
    <div class="seg-id" v-if="settings.showId"> 
      {{segment.scid}} 
    </div>
    <div class="seg-text seg-header" 
      :title="segment.scid"
      style="text-align: center"
    >
      <div :class="langClass('root')" 
        v-if="settings.showPali"
        v-html="segment.pli" />
      <div :class="langClass('trans')" 
        v-if="settings.showTrans"
        v-html="langText" />
      <div :class="langClass('ref')" 
        v-if="settings.showReference"
        v-html="segment[settings.refLang]" />
    </div>
  </div>
</template>

<script>
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useVolatileStore } from '../stores/volatile.mjs';
  import { useSuttasStore } from '../stores/suttas.mjs';
  import { logger } from "log-instance";
  import { Examples, SuttaRef } from "scv-esm";
  import { getCurrentInstance, nextTick, ref } from "vue";
  import { default as IdbSutta } from '../idb-sutta.mjs';
  import * as Idb from "idb-keyval";
  const EXAMPLE_TEMPLATE = IdbSutta.EXAMPLE_TEMPLATE;
  const EMPTY_TEXT = '<div class="empty-text">&#8211;&#8709;&#8211;</div>'

  var hello = 0;

  export default {
    props: {
      segment: { type: Object, required:true },
      idbSuttaRef: { type: Object, required:true },
      card: { type: Object, required:true },
      routeCard: { type: Object, required:true },
    },
    setup() {
      const settings = useSettingsStore();
      const volatile = useVolatileStore();
      const suttas = useSuttasStore();
      const showTakaNav = ref(false);
      return {
        settings,
        volatile,
        suttas,
        logger,
      }
    },
    components: {
    },
    async mounted() {
    },
    methods: {
      segId(seg) {
        let { card } = this;
        let [ suidSeg, lang, author ] = card.location;
        return `#/sutta/${seg.scid}/${lang}/${author}`;
      },
      langClass(langType) {
        let { layout, volatile, nCols } = this;
        let colw = "lg";
        switch (nCols) {
          case 3:
            colw = layout.w < 1132 ? "sm" : "lg";
            break;
          case 1:
            colw = layout.w < 600 ? "sm" : "lg";
            break;
          default:
            colw = "lg";
            break;
        }
        return `seg-lang seg-${langType} seg-lang-${nCols}col-${colw}`;
      },
      segMatchedClass(seg) {
        let { layout, card, currentScid, routeCard } = this;
        let idClass = layout.w < 1200 ? "seg-id-col" : "seg-id-row";
        let matchedClass = seg.matched ? "seg-match seg-matched" : "seg-match";
        let currentClass = seg.scid === currentScid ? "seg-current" : '';
        let routeClass = card === routeCard ? "seg-route" : "";
        return `${matchedClass} ${idClass} ${currentClass} ${routeClass}`;
      },
      hrefSuttaCentral(sutta_uid) {
        return `https://suttacentral.net/${sutta_uid}`;
      },
    },
    computed: {
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
      langText(ctx) {
        let { segment, langTrans, volatile } = ctx;
        let text = segment[langTrans] || EMPTY_TEXT;
        return text;
      },
      layout(ctx) {
        return ctx.volatile.layout.value;
      },
    },
  }
</script>

<style >
.seg-header div {
  margin-left: 0px;
}
</style>


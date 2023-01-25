<template>
  <div :id="segId" class="seg-anchor" >
    <span class="debug" v-if="logger.logLevel==='debug'">
      {{segment.scid}}
    </span>
  </div>
  <div :class="segMatchedClass(segment)">
    <div class="seg-id" v-if="settings.showId"> 
      {{segment.scid}} 
    </div>
    <div class="seg-text" 
      @click="clickSeg($event)"
      :title="segment.scid"
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
  import { useAudioStore } from '../stores/audio.mjs';
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
      return {
        audio: useAudioStore(),
        settings: useSettingsStore(),
        volatile: useVolatileStore(),
        suttas: useSuttasStore(),
        logger,
      }
    },
    components: {
    },
    async mounted() {
    },
    methods: {
      clickSeg(evt) {
        let { 
          audio, settings, segment:seg, idbSuttaRef, routeCard, currentScid, card,
        } = this;
        let { srcElement } = evt;
        let { className, innerText } = srcElement;
        let { scid } = seg;
        let audioFocus = document.getElementById('audio-focus');
        audioFocus?.focus();
        if (currentScid === scid && routeCard === card) {
          if (className === 'ebt-example') {
            let pattern = encodeURIComponent(innerText);
            let hash = `#/search/${pattern}`
            settings.setRoute(hash);
            return;
          } 
          audio.audioFocused = true;
        } else {
          let [ scidHash, lang, author ] = card.location;
          let hash = `#/sutta/${scid}/${lang}/${author}`
          card.location[0] = scid;
          settings.setRoute(hash);
          idbSuttaRef.highlightExamples({seg});
        }
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
        let { layout, card, currentScid, audio, routeCard } = this;
        let { audioFocused } = audio;
        let idClass = layout.w < 1200 ? "seg-id-col" : "seg-id-row";
        let matchedClass = seg.matched ? "seg-match seg-matched" : "seg-match";
        let currentClass = seg.scid === currentScid ? "seg-current" : '';
        let focusClass = seg.scid === audio.audioScid && audioFocused ? "seg-focus" : '';
        let routeClass = card === routeCard ? "seg-route" : "";
        return `${matchedClass} ${idClass} ${currentClass} ${routeClass} ${focusClass}`;
      },
      hrefSuttaCentral(sutta_uid) {
        return `https://suttacentral.net/${sutta_uid}`;
      },
    },
    computed: {
      segId(ctx) {
        let { segment, card } = ctx;
        let [ suidSeg, lang, author ] = card.location;
        return `#/sutta/${segment.scid}/${lang}/${author}`;
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
  line-height: 1.5;
}
.seg-lang {
  margin-bottom: 0.8em;
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
  xborder: 2px dotted rgba(var(--v-theme-on-surface), 0.5);
  background-color: rgba(var(--v-theme-currentbg),1);
  border-radius: 5px;
}
.seg-current .seg-text {
  opacity: 1;
  font-size: larger;
}
.seg-focus {
  border: 2px dotted rgba(var(--v-theme-matched), 1);
}
.seg-route .seg-text{
  opacity: 1;
}
.seg-route.seg-current .ebt-example{
}
.seg-route.seg-current .ebt-example:hover {
  text-decoration: underline;
  cursor: pointer;
}
.empty-text {
  color: #888;
  padding-left: 1em;
  padding-right: 1em;
}
</style>


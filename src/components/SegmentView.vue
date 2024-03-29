<template>
  <div :id="segId" class="seg-anchor" >
    <span class="debug" v-if="logger.logLevel==='debug'">
      {{segment.scid}}
    </span>
  </div>
  <div :class="segMatchedClass(segment)"
    @click='onClickSegBody'
    :title="segment.scid"
  >
    <div class="seg-id" v-if="settings.showId"> 
      {{segment.scid}} 
    </div>
    <div :class="textClass()" >
      <div :class="langClass('root')" 
        v-if="settings.showPali"
        v-html="segment.pli" />
      <div :class="langClass('trans')" 
        v-if="settings.showTrans"
        v-html="langText" />
      <div :class="langClass('ref')" 
        v-if="settings.showReference"
        v-html="segment.ref || segment[settings.refLang]" />
    </div>
  </div>
</template>

<script>
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useVolatileStore } from '../stores/volatile.mjs';
  import { useSuttasStore } from '../stores/suttas.mjs';
  import { useAudioStore } from '../stores/audio.mjs';
  import { logger } from "log-instance/index.mjs";
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
      onClickSegBody(evt) {
        let { 
          segment, currentScid, routeCard, card, settings, idbSuttaRef, volatile,
        } = this;
        const msg = `SegmentView.onClickSegBody(${segment.scid}) `;
        let { srcElement } = evt;
        let { className, innerText } = srcElement;
        let { scid } = segment;

        if (currentScid === scid && routeCard === card) {
          if (className === 'ebt-example') {
            let pattern = encodeURIComponent(innerText);
            let hash = `#/search/${pattern}`;
            volatile.setRoute(hash, undefined, msg);
          } 
        } else {
          let [ locationScid, lang, author ] = card.location;
          let hash = `#/sutta/${scid}/${lang}/${author}`
          card.location[0] = scid;
          volatile.setRoute(hash, undefined, msg);
          //idbSuttaRef.highlightExamples({segment});
        }
      },
      langClass(langType) {
        let { displayBox, volatile, nCols } = this;
        let colw = "lg";
        switch (nCols) {
          case 3:
            colw = displayBox.w < 1132 ? "sm" : "lg";
            break;
          case 1:
            colw = displayBox.w < 600 ? "sm" : "lg";
            break;
          default:
            colw = "lg";
            break;
        }
        return `seg-lang seg-${langType} seg-lang-${nCols}col-${colw}`;
      },
      textClass() {
        let { displayBox, volatile, nCols } = this;
        switch (nCols) {
          case 1:
            return "seg-text seg-text-1col";
            break;
          default:
            return "seg-text";
            break;
        }
      },
      segMatchedClass(seg) {
        let { displayBox, card, currentScid, audio, routeCard } = this;
        let { audioFocused } = audio;
        let idClass = displayBox.w < 1200 ? "seg-id-col" : "seg-id-row";
        let matchedClass = seg.matched ? "seg-match seg-matched" : "seg-match";
        let currentClass = seg.scid === currentScid ? "seg-current" : '';
        let audioClass = seg.scid === audio.audioScid && audioFocused ? "seg-audio" : '';
        return [
          'seg-body',
          matchedClass,
          idClass,
          currentClass,
          audioClass,
        ].join(' ');
      },
      hrefSuttaCentral(sutta_uid) {
        return `https://suttacentral.net/${sutta_uid}`;
      },
    },
    computed: {
      segBodyId(ctx) {
        let { card, segment } = ctx;
        return `${card.id}-${segment.scid}`;
      },
      segId(ctx) {
        let { segment, card } = ctx;
        return card.segmentElementId(segment.scid);
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
        let { displayBox } = volatile;
        let w = displayBox.value.w;
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
      displayBox(ctx) {
        return ctx.volatile.displayBox.value;
      },
    },
  }
</script>

<style >
.seg-match {
  display: flex;
  border-left: 2pt solid rgba(0,0,0,0);
}
.seg-matched {
  border-left-color: rgba(var(--v-theme-matched), 0.5);
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
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.seg-id-col .seg-id {
  margin-left: 5px;
}
.seg-text {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  opacity: 0.85;
  line-height: 1.5;
}
.seg-text-1col {
  flex-flow: column;
  max-width: 400px;
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
  font-size: 14px;
}
.seg-lang-1col-sm {
  width: 310px;
}
.seg-lang-1col-lg.seg-root,
.seg-lang-1col-sm.seg-root {
  padding-left: 0px;
}
.seg-lang-1col-lg.seg-trans,
.seg-lang-1col-sm.seg-trans {
  padding-left: 1.2em;
  background: linear-gradient(90deg,
    rgba(var(--v-theme-on-surface),0.1),
    rgba(0,0,0,0) 40% 
    );
}
.seg-lang-1col-lg.seg-ref,
.seg-lang-1col-sm.seg-ref {
  padding-left: 0px;
  font-size: 107%;
}
.seg-lang-1col-lg {
  max-width: 400px;
  padding-left: 1em;
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
  background-color: rgba(var(--v-theme-currentbg),1);
  border-radius: 5px;
}
.seg-current .seg-text {
  opacity: 1;
  font-size: larger;
}
.seg-audio {
  border: 2px dashed rgba(var(--v-theme-matched), 1);
}
.seg-audio .ebt-example:hover {
  text-decoration: underline;
  cursor: pointer;
}
.empty-text {
  color: #888;
  padding-left: 1em;
  padding-right: 1em;
}
.seg-body {
}
.seg-body:focus {
  border: 2px dotted rgba(var(--v-theme-matched), 1);
}
</style>


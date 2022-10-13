<template>
  <v-sheet :class="suttaClass">
    <div>
      <div v-if="settings.development">
      {{nCols}}
      {{suttaClass}}
      </div>
      <div class="sutta-title">
        <div v-for="t in title"> {{t}} </div>
      </div> <!-- sutta-title -->
      <template v-for="seg in segments">
        <div :class="segMatchedClass(seg)">
          <div class="seg-id" v-if="settings.showId"> 
            {{seg.scid}} 
          </div>
          <div class="seg-text">
            <div :class="langClass('root')" 
              v-if="settings.showPali"
              v-html="seg.pli" />
            <div :class="langClass('trans')" 
              v-if="settings.showTrans"
              v-html="seg[langTrans]" />
          </div>
        </div>
      </template>
    </div>
  </v-sheet>
</template>

<script>
  import { useSettingsStore } from '../stores/settings';
  import { useVolatileStore } from '../stores/volatile';
  import { logger } from "log-instance";
  import { SuttaRef } from "scv-esm";
  import { ref } from "vue";

  export default {
    props: {
      card: {
        type: Object,
        required: true,
      },
    },
    setup() {
      const settings = useSettingsStore();
      const volatile = useVolatileStore();
      const segments = ref([]);
      return {
        settings,
        volatile,
        suttaRef: undefined,
        segments,
      }
    },
    components: {
    },
    mounted() {
      let { segments, settings, volatile, card, } = this;
      let { location, data } = card;
      let [ sutta_uid, lang, author ] = location;
      let ref = {sutta_uid, lang, author}
      let refInst = SuttaRef.create(ref);
      if (refInst == null) {
        alert(`Invalid SuttaRef ${JSON.stringify(ref)}`);
        return;
      }
      let suttaRef = this.suttaRef = refInst.toString();
      let mlDoc;
      if (data) {
        this.bindMlDoc(data);
      } else {
        mlDoc = volatile.mlDocFromSuttaRef(suttaRef);
        if (mlDoc) {
          volatile.addMlDoc(mlDoc);
          this.bindMlDoc(mlDoc);
        } else {
          let url = settings.suttaRefUrl(suttaRef);
          let promise = volatile.fetchJson(url);
          promise.then(json=>{
            mlDoc = json.mlDocs[0];
            volatile.addMlDoc(mlDoc);
            this.bindMlDoc(mlDoc);
          });
        }
      }
    },
    methods: {
      langClass(langType) {
        let { nCols } = this;
        return `seg-${langType} seg-lang-${nCols}-col`;
      },
      bindMlDoc(mlDoc) {
        let { card } = this;
        let { segMap } = mlDoc;
        card.data = mlDoc;
        this.segments = Object.keys(segMap).map(segId=>segMap[segId]);
        let nSegments = this.segments.length;
        let { sutta_uid, lang, author_uid } = mlDoc;
        logger.info("SuttaView.bindMlDoc()", 
          { sutta_uid, lang, author_uid, nSegments});
      },
      segMatchedClass(seg) {
        return seg.matched ? "seg-match seg-matched" : "seg-match";
      },
    },
    computed: {
      suttaClass(ctx) {
        let { nCols, volatile } = ctx;
        let { layout } = volatile;
        switch (nCols) {
          case 2: return "sutta-2-col";
          default: return "sutta-1-col";
        }
      },
      nCols(ctx) {
        let { settings } = ctx;
        let nCols = 0;
        settings.showPali && nCols++;
        settings.showReference && nCols++;
        settings.showTrans && nCols++;
        settings.fullLine && (nCols = 1);
        return nCols;
      },
      langTrans(ctx) {
        let { settings, card } = ctx;
        let { location } = card;
        return location[1] || settings.langTrans;
      },
      mlDoc(ctx) {
        let { card } = ctx;
        return card.data;
      },
      title(ctx) {
        let { mlDoc={} } = ctx;
        let { title='(no-title)' } = mlDoc;
        return title.split('\n');
      },
    },
  }
</script>

<style scoped>
.sutta {
  margin-left: auto;
  margin-right: auto;
}
.sutta-1-col {
  max-width: 40em;
}
.sutta-2-col {
  max-width: 60em;
}
.sutta-3-col {
  max-width: 80em;
}
.sutta-title {
  display: flex;
  flex-flow: column;
  align-items: center;
  font-size: larger;
  font-weight: 600;
}
.seg-match {
  border-left: 2pt solid rgba(0,0,0,0);
  padding-left: 0.3em;
}
.seg-matched {
  border-left-color: rgb(var(--v-theme-chip));
}
.seg-id {
  font-size: x-small;
}
.seg-text {
  display: flex;
  flex-flow: row wrap;
  justify-content: start;
}
.seg-root {
  font-style: italic;
}
.seg-trans {
}
.seg-lang-1-col {
  min-width: 310px;
  max-width: 40em;
  margin-right: 0.3em;
  margin-bottom: 0.3em;
}
.seg-lang-2-col {
  width: 250px;
  margin-right: 0.3em;
  margin-bottom: 0.3em;
}
.seg-lang-3-col {
  width: 200px;
  margin-right: 0.3em;
  margin-bottom: 0.3em;
}
</style>


<template>
  <v-sheet class="sutta">
    <div>
      <h3>{{suttaRef}}</h3>
      <div class="sutta-title">
        <div v-for="t in title"> {{t}} </div>
      </div> <!-- sutta-title -->
      <template v-for="seg in segments">
        <div :class="segClass(seg)">
          <div class="seg-id">
            {{seg.scid}}
          </div>
          <div class="seg-pli">
            {{seg.pli}}
          </div>
          <div class="seg-trans">
            {{seg[langTrans]}}
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
      let suttaRef = SuttaRef.create({sutta_uid, lang, author}).toString();
      this.suttaRef = suttaRef;
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
      bindMlDoc(mlDoc) {
        let { card } = this;
        let { segMap } = mlDoc;
        card.data = mlDoc;
        this.segments = Object.keys(segMap).map(segId=>segMap[segId]);
        let nSegments = this.segments.length;
        let { sutta_uid, lang, author_uid } = mlDoc;
        logger.info("SuttaView.bindMlDoc()", { sutta_uid, lang, author_uid, nSegments});
      },
      segClass(seg) {
        return seg.matched ? "seg seg-matched" : "seg";
      },
    },
    computed: {
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
.seg {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  border-left: 2pt solid rgba(0,0,0,0);
  padding-left: 5pt;
}
.seg-matched {
  border-left-color: rgb(var(--v-theme-chip));
}
.sutta {
  max-width: 40em;
  margin-left: auto;
  margin-right: auto;
}
.sutta-title {
  display: flex;
  flex-flow: column;
  align-items: center;
  font-size: larger;
  font-weight: 600;
}
</style>


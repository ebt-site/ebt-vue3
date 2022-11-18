<template>
  <v-sheet v-if="card.isOpen" class="card-sheet">
    <div :id="`${card.topAnchor}`" class="card-top-anchor debug">
      {{card.topAnchor}}
    </div>
    <v-card :variant="cardVariant" class="ebt-card">
      <template v-slot:title>
        <v-icon :icon="card.icon" class="card-icon"/>
        <span :id="card.id">{{card.chipTitle($t)}}</span>
      </template>
      <template v-slot:append>
        <v-btn icon="mdi-trash-can-outline" flat
          v-if="isClosable"
          @click="settings.removeCard(card)"
        />
        <v-btn icon="mdi-close" flat 
          @click="closeCard(card)"
        />
      </template>
      <v-card-text>
        <home-view :card="card" v-if="card.context===CONTEXT_HOME"/>
        <search-view :card="card" v-if="card.context===CONTEXT_SEARCH"/>
        <sutta-view :card="card" v-if="card.context===CONTEXT_SUTTA"/>
        <wiki-view :card="card" v-if="card.context===CONTEXT_WIKI"/>
      </v-card-text>
      <div class="debug-footer" v-if="showDev" >
        <div class="debug-icon" @click="showDebug= !showDebug">
          <v-icon icon="mdi-hammer-wrench" size="x-small" class="debug" />
        </div>
        <v-card v-if="showDebug" class="debug" >
          <v-select v-model="card.context" :items="contexts"
            :label="'Context'"
            >
          </v-select>
          <v-card-text>
            <v-text-field v-model="card.location[0]"
              label="$t('ebt.location')"
            />
          </v-card-text>
          <table>
            <tbody>
              <tr> 
                <th>layout</th> 
                <td>{{JSON.stringify(volatile.layout.value)}}</td> 
              </tr>
              <tr> <th>id</th> <td>{{card.id}}</td> </tr>
              <tr> <th>isOpen</th> <td>{{card.isOpen}}</td> </tr>
              <tr> <th>chipTitle</th> <td>{{card.chipTitle($t)}}</td> </tr>
              <tr> <th>icon</th> <td>{{card.icon}}</td> </tr>
              <tr> <th>context</th> <td>{{card.context}}</td> </tr>
              <tr> <th>location</th> <td>{{card.location}}</td> </tr>
              <tr> <th>data</th> <td>{{card.data ? "yes" : "no"}}</td> </tr>
              <tr> <th>route</th> <td>{{Object.keys($route)}}</td> </tr>
              <tr> <th>route.fullPath</th> <td>{{$route.fullPath}}</td> </tr>
              <tr> <th>route.params</th> <td>{{$route.params}}</td> </tr>
              <tr> 
                <th>route.params. context</th> 
                <td>{{$route.params.context}}</td> 
              </tr>
              <tr> 
                <th>route.params.location</th> 
                <td>{{$route.params.location}}</td> 
              </tr>
            </tbody>
          </table>
        </v-card>
      </div>
    </v-card>
  </v-sheet>
</template>

<script>
  import { default as HomeView } from './HomeView.vue';
  import { default as SearchView } from './SearchView.vue';
  import { default as WikiView } from './WikiView.vue';
  import { default as SuttaView } from './SuttaView.vue';
  import { default as EbtCard } from '../ebt-card.mjs';
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useVolatileStore } from '../stores/volatile.mjs';
  import { ref } from "vue";

  export default {
    props: {
      card: {
        type: Object,
      },
    },
    setup() {
      const settings = useSettingsStore();
      const volatile = useVolatileStore();
      const showDebug = ref(false);

      return {
        settings,
        showDebug,
        volatile,
      }
    },
    components: {
      HomeView,
      SearchView,
      SuttaView,
      WikiView,
    },
    methods: {
      mouseDown: (card, evt) => {
        console.log("DEBUG mouseDown", evt);
      },
      mouseUp: (card, evt) => {
        console.log("DEBUG mouseUp", evt);
      },
      closeCard: (card) => {
        card.isOpen = false;
      },
    },
    mounted() {
    },
    computed: {
      isClosable(ctx) {
        let { card } = ctx;
        return card.context !== EbtCard.CONTEXT_HOME;
      },
      showDev(ctx) {
        let logLevel = ctx.settings.logLevel;

        return logLevel === 'info' || logLevel === 'debug';
      },
      cardVariant: (ctx) => {
        let { settings } = ctx;
        return settings.cardsOpen === 1 ? "flat" : "outlined";
      },
      cardLink: (ctx) => {
        let { card } = ctx;
        let { context, location } = card;
        context = encodeURIComponent(context);
        location = location.map(loc => encodeURIComponent(location)).join('/');
        let link = `/${context}/${location}`;
        return link;
      },
      CONTEXT_HOME: (ctx)=>EbtCard.CONTEXT_HOME,
      CONTEXT_SEARCH: (ctx)=>EbtCard.CONTEXT_SEARCH,
      CONTEXT_WIKI: (ctx)=>EbtCard.CONTEXT_WIKI,
      CONTEXT_SUTTA: (ctx)=>EbtCard.CONTEXT_SUTTA,
      contexts: (ctx) => {
        let { $t } = ctx;
        return [{
          title: $t('ebt.context-home'),
          value: EbtCard.CONTEXT_HOME,
        },{
          title: $t('ebt.context-sutta'),
          value: EbtCard.CONTEXT_SUTTA,
        },{
          title: $t('ebt.context-search'),
          value: EbtCard.CONTEXT_SEARCH,
        },{
          title: $t('ebt.context-wiki'),
          value: EbtCard.CONTEXT_WIKI,
        }];
      },
    },
  }
</script>

<style scoped>
  table {
    border: 1pt solid ;
    padding: 2pt;
  }
  thead th {
    border-bottom: 1pt solid;
  }
  tbody th {
    text-align: right;
    padding-right: 0.5em;
    border-right: 1pt solid ;
  }
  td {
    padding-left: 0.5em;
  }
  .card-top-anchor {
    font-size: 12px;
    position: relative;
    overflow: hidden;
    border-left: 1pt solid rgb(0,0,0,0);
    width: 1px;
    top: 0em;
  }
  .card-title-anchor {
    position: relative;
  }
  .card-icon {
    opacity: 0.5;
  }
  .debug-icon {
    color: cyan;
    font-size: smaller;
    opacity: 0.5;
    text-align: right;
    margin-right: 1pt;
    cursor: pointer;
  }
  .debug-icon:hover {
    opacity: 1;
  }
  .debug-footer {
    font-size: smaller;
  }
  th {
    vertical-align: top;
  }
  .ebt-card {
    background: rgb(var(--v-theme-surface));
    margin-left: 2pt;
    margin-right: 2pt;
  }
  @media (max-width: 400px) {
    .ebt-card {
      max-width: 375px;
    }
  }
  .debug {
    color: rgb(var(--v-theme-placeholder));
  }
  .v-card-text {
    min-width: 20em;
  }
  .close-item {
    cursor: pointer;
  }
  .close-item:hover {
    color: rgb(var(--v-theme-link));
  }
  .card-sheet {
    background: rgba(0,0,0,0);
  }
</style>


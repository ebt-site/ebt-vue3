<template>
  <v-sheet>
    <div :id="card.topAnchor" class="card-top-anchor">
      <a :name="card.anchor"></a>
    </div>
    <div :id="card.titleAnchor" class="card-title-anchor">
        <a :name="card.titleAnchor"></a>
    </div>
    <v-card v-if="card.isOpen" :variant="cardVariant" >
      <template v-slot:title>
        <v-icon :icon="card.icon"/>
        {{card.chipTitle($t)}}
      </template>
      <template v-slot:append>
        <v-btn icon="mdi-close" @click="closeCard(card)"
        />
      </template>
      <v-card-text>
        <home-view card="card" v-if="card.context===CONTEXT_HOME"/>
        <search-view card="card" v-if="card.context===CONTEXT_SEARCH"/>
        <sutta-view card="card" v-if="card.context===CONTEXT_SUTTA"/>
        <wiki-view card="card" v-if="card.context===CONTEXT_WIKI"/>
      </v-card-text>
      <div class="debug-footer" >
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
              <tr> <th>id</th> <td>{{card.id}}</td> </tr>
              <tr> <th>isOpen</th> <td>{{card.isOpen}}</td> </tr>
              <tr> <th>chipTitle</th> <td>{{card.chipTitle($t)}}</td> </tr>
              <tr> <th>icon</th> <td>{{card.icon}}</td> </tr>
              <tr> <th>context</th> <td>{{card.context}}</td> </tr>
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
  import { useSettingsStore } from '../stores/settings';
  import { useVolatileStore } from '../stores/volatile';
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
      closeCard: (card) => {
        card.isOpen = false;
      },
    },
    mounted() {
    },
    computed: {
      testLinks: (ctx) => [
        "#/",
        "#/wiki",
        "#/sutta",
        "#/search",
        "#/search/DN33",
        "#/wiki/welcome",
        "#/wiki/about",
        "#/sutta/DN33",
        "#/search/root%20of%20suffering",
      ],
      cardVariant: (ctx) => {
        let { settings } = ctx;
        return settings.cardsOpen === 1 ? "flat" : "outlined";
      },
      topAnchor: (ctx) => {
        let {card} = ctx;
        return `${card.id}-top`;
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
    position: relative;
    top: -7.0em;
  }
  .card-title-anchor {
    position: relative;
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
  .ebt-card {
    margin: 1pt;
    margin: 1pt;
  }
  .debug {
    color: rgb(var(--v-theme-placeholder));
  }
</style>


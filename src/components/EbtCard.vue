<template>
  <div>
    <div class="card-link"><a :name="cardLink"/></div>
    <v-card variant="outlined" class="ebt-card">
      <template v-slot:title>
        <v-icon :icon="card.icon"/>
        {{card.chipTitle($t)}}
      </template>
      <template v-slot:append>
        <v-btn icon="mdi-close" @click="closeCard(card)"
        />
      </template>
      <v-card-text>
        <search-view card="card" v-if="card.context===CONTEXT_SEARCH"/>

        <div class="debug" v-if="card.context!==CONTEXT_SEARCH">
          <div class="text-subtitle-1">Debug Stuff (Ignore)</div>
          <template v-for="link in testLinks">
            <div>
              <a :href="`${link}`">{{link}}</a>
            </div>
          </template>
          <p>"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."</p>
          <p>"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."</p>
          <p>"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."</p>
          <p>"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."</p>
        </div><!--debug-->
      </v-card-text>
      <div class="debug-footer" >
        <div class="debug-icon" @click="showDebug= !showDebug">
          <v-icon icon="mdi-hammer-wrench" size="x-small" class="debug" />
        </div>
        <v-card v-if="showDebug" class="debug">
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
  </div>
</template>

<script>
  import { default as SearchView } from './SearchView.vue';
  import { default as EbtCard } from '../ebt-card.mjs';
  import { useSettingsStore } from '../stores/settings';
  import { ref } from "vue";

  export default {
    props: {
      card: {
        type: Object,
      },
    },
    setup() {
      const settings = useSettingsStore();
      const showDebug = ref(false);

      return {
        settings,
        showDebug,
      }
    },
    components: {
      SearchView,
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
        "#/wiki/welcome",
        "#/sutta/DN33",
        "#/search/root%20of%20suffering",
      ],
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
  .card-link {
    position: relative;
    top: -7.0em;
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
    max-width: 40em;
  }
  .debug {
    color: cyan;
  }
</style>


<template>
  <div class="ebt-cards">
    <div v-for="card in settings.cards">
      <template v-if="card.isOpen">
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
              <v-text-field v-model="card.location"
                label="$t('ebt.location')"
                >
              </v-text-field>
              <p>"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."</p>
              <p>"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."</p>
              <p>"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."</p>
              <p>"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."</p>
              <table>
                <tbody>
                  <tr> <th>id</th> <td>{{card.id}}</td> </tr>
                  <tr> <th>isOpen</th> <td>{{card.isOpen}}</td> </tr>
                  <tr> <th>chipTitle</th> <td>{{card.chipTitle($t)}}</td> </tr>
                  <tr> <th>icon</th> <td>{{card.icon}}</td> </tr>
                  <tr> <th>context</th> <td>{{card.context}}</td> </tr>
                </tbody>
              </table>
              <v-select v-model="card.context" :items="contexts"
                :label="'Context'"
                >
              </v-select>
            </div><!--debug-->
          </v-card-text>
        </v-card>
      </template>
    </div><!-- card -->
  </div>
</template>

<script>
  import { default as SearchView } from './SearchView.vue';
  import { default as EbtCard } from '../ebt-card.mjs';
  import { useSettingsStore } from '../stores/settings';
  import { ref } from "vue";

  export default {
    setup() {
      const settings = useSettingsStore();

      return {
        settings,
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
      CONTEXT_SEARCH: (ctx)=>EbtCard.CONTEXT_SEARCH,
      CONTEXT_WIKI: (ctx)=>EbtCard.CONTEXT_WIKI,
      CONTEXT_SUTTA: (ctx)=>EbtCard.CONTEXT_SUTTA,
      contexts: (ctx) => {
        let { $t } = ctx;
        return [{
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
  .ebt-cards {
    display: flex;
    flex-flow: row wrap;
    justify-content: space between;
  }
  .ebt-card {
    max-width: 40em;
  }
  .debug {
    color: cyan;
  }
</style>


<template>
  <v-sheet class="results">
    <v-card>
      <v-card-text>
        <v-radio-group v-model="settings.searchMode" 
          :inline="layout.w > 600"
          :label="$t('ebt.search')">
          <v-radio :label="$t('ebt.examples')" value="examples" 
          />
          <v-radio :label="$t('ebt.text')" value="text" 
            :value-comparator="(a,b) => a !== 'examples'"
          />
        </v-radio-group>
        <v-autocomplete v-if="settings.searchMode==='examples'"
          v-model="search" 
          :append-icon="search ? 'mdi-magnify' : ''"
          clearable
          @click:append="onSearch"
          @click:clear="onSearchCleared($event, card)"
          :hint="$t('auth.required')"
          @update:search="updateSearch($event)"
          @keyup.enter="onEnter($event)"
          :filter="searchFilter"
          :items="searchItems"
          :label="$t('ebt.examples')"
          :placeholder="$t('ebt.searchPrompt')"
          variant="underlined"
        />
        <v-text-field v-if="settings.searchMode!=='examples'"
          v-model="search" 
          :append-icon="search ? 'mdi-magnify' : ''"
          clearable 
          @click:append="onSearch"
          @click:clear="onSearchCleared($event, card)"
          @keydpress="onSearchKey($event)"
          :hint="$t('auth.required')"
          :label="$t('ebt.text')"
          :placeholder="$t('ebt.searchPrompt')"
          variant="underlined"
        />
      </v-card-text>
    </v-card>
    <search-results :card="card" :results="results"/>
  </v-sheet>
</template>

<script>
  import { default as SearchResults } from "./SearchResults.vue";
  import { useSettingsStore } from '../stores/settings';
  import { useVolatileStore } from '../stores/volatile';
  import { logger } from "log-instance";
  import { Examples } from "scv-esm";
  import { ref, nextTick } from "vue";

  export default {
    props: {
      card: {
        type: Object,
      },
    },
    setup() {
      const settings = useSettingsStore();
      const volatile = useVolatileStore();
      return {
        settings,
        volatile,
      }
    },
    data: () => {
      return {
        results: undefined,
        search: '',
      }
    },
    components: {
      SearchResults,
    },
    methods: {
      searchFilter(item, queryText, itemText) {
        let it = itemText.toLowerCase();
        let qt = queryText.toLowerCase();
        return it.indexOf(qt) >= 0;
      },
      onEnter(evt) {
        logger.info('onEnter()', {evt});
      },
      async onSearch(evt) {
        let { volatile, url, search, card, } = this;
        let res;
        try {
          logger.info('onSearch()', {url, volatile});
          card.location[0] = search;
          this.results = undefined;
          volatile.waiting = true;
          res = await fetch(url);
          this.results = res.ok
            ? await res.json()
            : res;
          window.location.hash = `#${card.anchor}`;
          let { mlDocs=[] } = this.results;
          card.data = this.results.results;
          mlDocs.forEach(mld=>volatile.addMlDoc(mld));
        } catch(e) {
          console.error("onSearch() ERROR:", res, e);
          this.results = `ERROR: ${url.value} ${e.message}`;
        } finally {
          volatile.waiting = false;
        }
      },
      updateSearch(val) {
        console.log('updateSearch', val);
        this.search = val;
      },
      onSearchKey(evt) {
        if (evt.code === "Enter") {
          let { card, search } = this;
          console.log('onSearchKey', {card, search});
          search && this.onSearch(evt);
          evt.preventDefault();
        }
      },
      onSearchCleared(evt) {
        this.results = undefined;
        this.search = '';
      },
    },
    mounted() {
      let { card } = this;
      console.log('SearchView.mounted()', {card});
      this.search = card.location[0];
    },
    computed: {
      searchItems() {
        let { search='', settings } = this;
        let { langTrans } = settings;
        var searchLower = search.toLowerCase();
        var langEx = Examples[langTrans] || Examples.en;
        var examples = search
          ? langEx.filter(ex=>ex.toLowerCase().indexOf(searchLower)>=0)
          : langEx;
        return !search || Examples.isExample(search)
          ? [ ...examples ]
          : [`${this.search}`, ...examples];
      },
      url: (ctx) => {
        let { search, settings, card } = ctx;
        let { langTrans } = settings;
        let pattern = search && search.toLowerCase().trim();
        let url = [
          settings.serverUrl,
          'search',
          encodeURIComponent(pattern),
        ].join('/');
        let lang = pattern.split('/')[1];
        return lang == null 
          ? `${url}/${langTrans}`
          : `${url}/${lang}`;
      },
      layout(ctx) {
        let { volatile } = ctx;
        let { layout } = volatile;
        return layout.value || layout;
      },
    },
  }
</script>

<style scoped>
.results {
  max-width: 40rem;
}
</style>

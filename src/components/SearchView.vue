<template>
  <v-sheet class="results">
    <v-text-field v-model="search" 
      clearable variant="underlined"
      :label="$t('ebt.search')"
      @click:append="onSearch"
      @click:clear="onSearchCleared($event, card)"
      @keypress="onSearchKey($event, card, search)"
      :append-icon="search ? 'mdi-magnify' : ''"
      :hint="$t('auth.required')"
      :placeholder="$t('ebt.searchPrompt')">
    </v-text-field>
    <search-results :card="card" :results="results"/>
  </v-sheet>
</template>

<script>
  import { default as SearchResults } from "./SearchResults.vue";
  import { useSettingsStore } from '../stores/settings';
  import { useVolatileStore } from '../stores/volatile';
  import { logger } from "log-instance";
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
          //window.location.hash = this.hash;
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
      hash: (ctx) => {
        let { search, card } = ctx;
        let pattern = search && search.toLowerCase().trim();
        let hash = [
          '#/search',
          encodeURIComponent(pattern),
          card.location[1],
        ].join('/');
        return hash;
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
    },
  }
</script>

<style scoped>
.results {
  max-width: 40rem;
}
</style>

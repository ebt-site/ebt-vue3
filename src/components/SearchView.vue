<template>
  <v-sheet>
    <v-text-field v-model="search" 
      clearable variant="underlined"
      label="pattern"
      @click:append="onSearch"
      @click:clear="onSearchCleared($event, card)"
      @keypress="onSearchKey($event, card, search)"
      :append-icon="search ? 'mdi-magnify' : ''"
      hint="Required"
      placeholder="Enter sutta id or search text">
    </v-text-field>
    <search-results :results="results"/>
  </v-sheet>
</template>

<script>
  import { default as SearchResults } from "./SearchResults.vue";
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
          console.log('onSearch() url:', url);
          card.location = [search];
          this.results = undefined;
          volatile.waiting = true;
          res = await fetch(url);
          this.results = res.ok
            ? await res.json()
            : res;
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
</style>

<template>
  <v-sheet class="ebt-search">
    <v-card>
      <v-card-text>
        <v-autocomplete 
          v-model="search" 
          :append-icon="search ? 'mdi-magnify' : ''"
          clearable
          @click:append="onSearch"
          @click:clear="onSearchCleared($event, card)"
          :hint="$t('auth.required')"
          @update:search="updateSearch($event)"
          @keyup.enter="onEnter($event)"
          :filter="searchFilter"
          :items="exampleItems"
          :label="$t('ebt.search')"
          :placeholder="$t('ebt.searchPrompt')"
          variant="underlined"
        />
        <div class="inspire" v-if="hasExamples">
          <v-btn variant=tonal @click="onInspireMe">
            {{$t('ebt.inspireMe')}}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
    <search-results :card="card" :results="results" 
      :class="resultsClass"/>
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
      onInspireMe() {
        let { langTrans, settings } = this;
        let that = this;
        let langEx = Examples[langTrans] || [];
        let iExample = Math.trunc(Math.random() * langEx.length);
        let eg = langEx[iExample];
        this.search = eg;
        this.onSearch();
        logger.info('onInspireMe', eg);
      },
      searchFilter(item, queryText, itemText) {
        let it = itemText.toLowerCase();
        let qt = queryText.toLowerCase();
        return it.indexOf(qt) >= 0;
      },
      onEnter(evt) {
        let { search } = this;
        logger.info('onEnter()', {evt});
        search && this.onSearch();
      },
      async onSearch() {
        let { volatile, url, search, card, } = this;
        let res;
        let waitingOld = volatile.waiting;
        try {
          logger.info('onSearch()', {url, volatile});
          this.results = undefined;
          card.location[0] = search;
          volatile.waiting++;
          res = await volatile.fetchJson(url);
          this.results = res.ok
            ? await res.json()
            : res;
          window.location.hash = card.routeHash();
          let { mlDocs=[] } = this.results;
          card.data = this.results.results;
          mlDocs.forEach(mld=>volatile.addMlDoc(mld));
        } catch(e) {
          console.error("onSearch() ERROR:", res, e);
          this.results = `ERROR: ${url} ${e.message}`;
        } finally {
          volatile.waiting = waitingOld;
        }
      },
      updateSearch(search) {
        let { card } = this;
        if (search) {
          this.search = search;
        }
      },
      onSearchKey(evt) {
        if (evt.code === "Enter") {
          let { card, search } = this;
          console.log('onSearchKey', {card, search});
          search && this.onSearch();
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
      resultsClass(ctx) {
        let { card, search } = this;
        return !search || card.location[0] === search 
          ? "ebt-results-new" 
          : "ebt-results-old";
      },
      exampleItems() {
        let { card, search='', settings } = this;
        let { langTrans, maxResults } = settings;
        var searchLower = search.toLowerCase();
        var langEx = Examples[langTrans] || Examples.en;
        var examples = search
          ? langEx.filter(ex=>ex.toLowerCase().indexOf(searchLower)>=0)
          : langEx;

        // Include card location
        let loc0 = card.location[0];
        loc0 = loc0 ? loc0.toLowerCase() : '';
        if (loc0 && loc0 !== search.toLowerCase()) {
          examples = [loc0, ...examples];
        }

        // Include adhoc search
        examples = !search || Examples.isExample(search)
          ? [...examples ]
          : [`${this.search}`, ...examples];

        let MAX_CHOICES = 8; // TODO: Ayya Sabbamitta wants more
        return examples.slice(0,MAX_CHOICES);
      },
      url: (ctx) => {
        let { search, settings, card } = ctx;
        let { langTrans, maxResults } = settings;
        let pattern = search && search.toLowerCase().trim();
        let url = [
          settings.serverUrl,
          'search',
          encodeURIComponent(pattern),
        ].join('/');
        let query=[
          `maxResults=${maxResults}`,
        ].join('&');
        let lang = pattern.split('/')[1];
        return lang == null 
          ? `${url}/${langTrans}?${query}`
          : `${url}/${lang}?${query}`;
      },
      layout(ctx) {
        let { volatile } = ctx;
        let { layout } = volatile;
        return layout.value || layout;
      },
      langTrans(ctx) {
        return ctx.settings.langTrans;
      },
      hasExamples(ctx) {
        let { langTrans } = ctx;
        return !!Examples[langTrans];
      }
    },
  }
</script>

<style>
.inspire {
  display: flex;
  justify-content: center;
}
.ebt-search {
  min-width: 350px;
  max-width: 50em;
}
.ebt-results-new {
}
.ebt-results-old {
  opacity: 0.5;
}
.v-autocomplete__content {
  border: 1pt solid rgb(var(--v-theme-matched));
}
</style>

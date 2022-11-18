<template>
  <v-app>
    <v-main >
      <v-app-bar color="toolbar" flat 
        :extension-height="collapsed ? 0 : 40"
        class="nav-bar"
        :collapse="collapsed"
      >
        <template v-if="collapsed">
          <v-btn icon @click="collapsed=false">
            <v-icon icon="mdi-arrow-expand-right" />
          </v-btn>
        </template> <!-- collapsed -->
        <template v-if="!collapsed">
          <v-app-bar-title > 
            <div class="ebt-title">
              <img src="/img/jan-kopriva-7BootnN3-0I-unsplash.jpg"
                @click="collapsed=true"
                class="ebt-nav-img"
              />
              <div>EBT-Vue3</div>
            </div>
          </v-app-bar-title>
          
          <v-menu location="bottom" attach=true v-if="narrowView">
            <template v-slot:activator="{ props }">
              <div class="app-menu-activator">
                <v-btn v-bind="props" icon>
                  <v-icon icon="mdi-menu" />
                </v-btn>
              </div>
            </template>
            <v-sheet class="app-menu-items">
              <v-btn icon href="#/search" >
                <v-icon icon="mdi-magnify"/>
              </v-btn>
              <Settings />
            </v-sheet>
          </v-menu>
          <div v-if="!narrowView">
            <v-btn icon href="#/search" >
              <v-icon icon="mdi-magnify"/>
            </v-btn>
            <Settings />
          </div>
        </template>
        <template v-if="!collapsed" v-slot:extension>
          <ebt-chips />
        </template> <!-- !collapsed -->
      </v-app-bar>

      <v-sheet>
        <div>
          <ebt-processing />
          <router-view />
        </div>
      </v-sheet>

      <v-sheet class="gdrp" v-if="settings.showGdpr">
        {{$t('ebt.allowSettings')}}
        <a href="#/wiki/privacy">{{$t('ebt.allowSettingsLink')}}</a>
        <v-icon icon="mdi-close-circle" 
          class="ml-2"
          @click="clickGdrp"/>
      </v-sheet>

    </v-main>
  </v-app>
</template>

<script>
  import EbtCards from './components/EbtCards.vue';
  import EbtChips from './components/EbtChips.vue';
  import Settings from './components/Settings.vue';
  import EbtProcessing from './components/EbtProcessing.vue';
  import { useSettingsStore } from './stores/settings.mjs';
  import { useVolatileStore } from './stores/volatile.mjs';
  import { logger } from "log-instance";
  import { ref } from "vue";

  export default {
    setup() {
      const tabs = ref([]);
      return {
        tabs,
      }
    },
    data: ()=>({
      settings: useSettingsStore(),
      volatile: useVolatileStore(),
      unsubscribe: undefined,
      collapsed: false,
    }),
    components: {
      EbtCards,
      EbtChips,
      Settings,
      EbtProcessing,
    },
    methods: {
      allowLocalStorage() {
        let { settings } = this;
        settings.saveSettings();
        logger.debug("allowLocalStorage()", settings);
      },
      clickGdrp(evt) {
        let { settings } = this;
        logger.debug('clickGdrp', evt);
        settings.showGdpr = false;
        evt.preventDefault();
      },
    },
    mounted() {
      let { $vuetify, settings, $i18n, } = this;
      $vuetify.theme.global.name = settings.theme === 'dark' ? 'dark' : 'light';;
      $i18n.locale = settings.locale;
      this.unsubscribe = settings.$subscribe((mutation, state) => {
        $vuetify.theme.global.name = settings.theme === 'dark' ? 'dark' : 'light';;
        logger.debug("App.mounted() App.mounted() subscribe =>", {mutation, state});
        settings.saveSettings();
        $i18n.locale = settings.locale;
      });
    },
    computed: {
      layout(ctx) {
        return ctx.volatile.layout.value;
      },
      narrowView(ctx) {
        let { layout } = ctx;
        return layout.w < 400;
      },
    },
  }
</script>
<style scoped>
.gdrp {
  position: fixed;
  color: rgb(var(--v-theme-chip));
  bottom: 0;
  right: 0;
  opacity: 1;
  padding: 2pt;
  border-top: 1pt solid rgb(var(--v-theme-chip));
  border-left: 1pt solid rgb(var(--v-theme-chip));
  border-radius: 3pt;
}
.v-toolbar-title {
  margin-left: 0px;
  min-width: 13em;
}
.ebt-nav-img {
  display: relative;
  height: 56px;
  cursor: pointer;
  margin-right: 5px;
  border: 1pt solid rgb(0,0,0);
  border-radius: 5px;
}
.ebt-title {
  display: flex;
  align-items: center;
}
.ebt-title:focus-within a {
  border: none !important;
  outline: none;
}
.ebt-title:focus-within img {
  font-size: 1.5rem !important;
  border: 1pt dashed rgb(var(--v-theme-chip));
}
.nav-bar {
  background: linear-gradient(130deg, #000, rgb(var(--v-theme-toolbar))) !important;
}
.app-menu-activator {
  padding-right: 10px;
}
.app-menu-items {
  display: flex;
  flex-flow: row nowrap ;
  border: 1px solid rgb(var(--v-theme-on-surface));
  border-radius: 10px !important;
  border-top-right-radius: 0px !important;
  background: rgba(var(--v-theme-surface), 0.5);
}
</style>


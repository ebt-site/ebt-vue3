<template>
  <v-app>
    <v-main >
      <v-app-bar color="toolbar" flat 
        :extension-height="collapsed ? 0 : 40"
        class="nav-bar"
        :collapse="collapsed"
      >
        <template v-if="collapsed">
          <v-btn icon @click="collapsed = false">
            <v-icon icon="mdi-arrow-expand-right" />
          </v-btn>
        </template> <!-- collapsed -->
        <template v-if="!collapsed">
          <v-app-bar-title > 
            <div class="ebt-title" @click="collapsed=true">
              <img src="/img/jan-kopriva-7BootnN3-0I-unsplash.jpg"
                class="ebt-nav-img"
              />
              <div>EBT-Vue3</div>
            </div>
          </v-app-bar-title>
          <v-spacer/>
          <v-btn icon href="#/search">
            <v-icon icon="mdi-magnify"/>
          </v-btn>
          <Settings />
        </template>
        <template v-if="!collapsed" v-slot:extension>
          <ebt-chips />
        </template> <!-- !collapsed -->
      </v-app-bar>
      <v-progress-linear v-if="volatile.waiting"
        indeterminate color="secondary" class="mb-0"/>

      <v-sheet>
        <div>
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
  import { useSettingsStore } from './stores/settings';
  import { useVolatileStore } from './stores/volatile';
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
  min-width: 14em;
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
</style>


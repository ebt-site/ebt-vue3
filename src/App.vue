<template>
  <v-app>
    <v-main>
      <v-app-bar color="toolbar" flat >
        <v-app-bar-title > 
          EBT-Vue3
        </v-app-bar-title>
        <v-spacer/>
        <v-btn icon @click="settings.addCard()">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
        <Settings/>
        <template v-slot:extension>
          <ebt-chips/>
        </template>
      </v-app-bar>
      <v-progress-linear v-if="volatile.waiting"
        indeterminate color="secondary" class="mb-0"/>
      <!--v-alert v-if="!settings.isLocalStorage" type="info">
        <div>
          {{$t('ebt.allowSettings')}}
        </div>
        <v-btn @click="allowLocalStorage" dark>
          {{$t('ebt.allow')}}
        </v-btn>
      </v-alert-->

      <v-sheet>
        <ebt-cards/>
      </v-sheet>

      <v-sheet class="gdrp" v-if="settings.showGdpr">
        <v-chip 
          color="chip"
          size="small"
          append-icon="mdi-close-circle"
          @click="clickGdrp">
          {{$t('ebt.allowSettings')}}
        </v-chip>
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
        console.log("allowLocalStorage()", settings);
      },
      clickGdrp(evt) {
        let { settings } = this;
        console.log('clickGdrp', evt);
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
        console.debug("App.mounted() App.mounted() subscribe =>", {mutation, state});
        settings.saveSettings();
        $i18n.locale = settings.locale;
      });
    },
  }
</script>
<style scoped>
.gdrp {
  position: fixed;
  bottom: 0;
  right: 0;
  opacity: 1;
}
</style>


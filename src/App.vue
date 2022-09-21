<template>
  <v-app>
    <v-main>
      <v-app-bar color="toolbar" flat >
        <v-app-bar-title > 
          EBT-Vue3
        </v-app-bar-title>
        <v-spacer/>
        <Settings/>
      </v-app-bar>
      <v-progress-linear v-if="volatile.waiting"
        indeterminate color="secondary" class="mb-0"/>
      <v-alert v-if="!settings.isLocalStorage" type="info">
        <div>
          {{$t('ebt.allowSettings')}}
        </div>
        <v-btn @click="allowLocalStorage" dark>
          Allow
        </v-btn>
      </v-alert>
      <v-card v-if="settings.isLocalStorage">
        <v-card-title> 
          REST API Endpoints
        </v-card-title>
        <v-expansion-panels variant="inset">
          <Search/>
          <PlaySegment/>
          <Download/>
        </v-expansion-panels>
        <v-card-text>
          <details>
            <summary>DEBUG</summary>
            <v-btn @click="onTest">
              Test
            </v-btn>
            <div class="text-h6"> Font Test </div>
            <div style="font-family:Roboto;">
              <div class="text-h4">Roboto</div>
              <div >
                Karonti kho, vāseṭṭha, sakyā raññe pasenadimhi kosale nipaccakāraṁ abhivādanaṁ paccuṭṭhānaṁ añjalikammaṁ sāmīcikammaṁ.
              </div>
            </div>
            <div style="font-family:SourceSansPro !important;">
              <div class="text-h4">SourceSansPro</div>
              <div >
                Karonti kho, vāseṭṭha, sakyā raññe pasenadimhi kosale nipaccakāraṁ abhivādanaṁ paccuṭṭhānaṁ añjalikammaṁ sāmīcikammaṁ.
              </div>
            </div>
            <div >
              <div class="text-h4">DefaultFont</div>
              <div >
                Karonti kho, vāseṭṭha, sakyā raññe pasenadimhi kosale nipaccakāraṁ abhivādanaṁ paccuṭṭhānaṁ añjalikammaṁ sāmīcikammaṁ.
              </div>
            </div>
          </details> <!-- Debug -->
        </v-card-text>
      </v-card>
    </v-main>
  </v-app>
</template>

<script setup>
//import AwsCreds from './components/AwsCreds.vue'
//import Authenticated from './components/Authenticated.vue'
import Settings from './components/Settings.vue'
import { useSettingsStore } from './stores/settings'
import { useVolatileStore } from './stores/volatile'
import Search from './components/Search.vue'
import PlaySegment from './components/PlaySegment.vue'
import Download from './components/Download.vue'
import { onMounted, ref } from 'vue'
import * as vue from 'vue'
import { useLocale } from "vuetify"
import { en, de } from 'vuetify/locale'

const showMenu = ref(false);

function onMenu(value) {
  showMenu.value = !showMenu.value;
  console.log('App.onMenu()', value, showMenu.value);
}
function onTest(ctx) {
  alert("test");
}

</script>
<script>
  export default {
    data: ()=>({
      settings: useSettingsStore(),
      volatile: useVolatileStore(),
      unsubscribe: undefined,
    }),
    methods: {
      allowLocalStorage() {
        let { settings } = this;
        settings.saveSettings();
        console.log("allowLocalStorage()", settings);
      },
    },
    mounted() {
      let { $vuetify, settings, $i18n, } = this;
      $vuetify.theme.global.name = settings.theme === 'dark' ? 'dark' : 'light';;
      $i18n.locale = settings.locale;
      this.unsubscribe = settings.$subscribe((mutation, state) => {
        $vuetify.theme.global.name = settings.theme === 'dark' ? 'dark' : 'light';;
        console.debug("App.mounted() App.mounted() subscribe =>", {mutation, state});
        if (settings.isLocalStorage) {
          settings.saveSettings();
          $i18n.locale = settings.locale;
        }
      });
    },
  }
</script>

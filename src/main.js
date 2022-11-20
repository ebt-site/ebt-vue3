import { createApp, ref } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { logger } from 'log-instance';
logger.logLevel = 'warn';

const pinia = createPinia();

// Styles
import '@mdi/font/css/materialdesignicons.css'
import './assets/main.css'
import 'vuetify/styles'

import colors from 'vuetify/lib/util/colors'

let COLOR_SAFFRON = "#ff9933";
const vuetifyOpts = {
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        dark: false,
        colors: {
          background: colors.grey.lighten3,
          surface:"#ffffff",
          chip: colors.brown.darken2,
          link: colors.brown.darken2,
          toolbar: colors.brown.darken2,
          matched: "#bf235d",
          placeholder: "#600060",
          expansion: colors.grey.lighten4,
          progress1: COLOR_SAFFRON,
          progress2: "#333333",
        },
      },
      dark: {
        dark: true,
        colors: {
          background: "#121212",
          surface: "#000000",
          chip: COLOR_SAFFRON,
          link: COLOR_SAFFRON,
          matched: COLOR_SAFFRON,
          toolbar: colors.brown.darken2,
          placeholder: "#00FFFF",
          expansion: colors.grey.darken2,
          progress1: COLOR_SAFFRON,
          progress2: "#eeeeee",
        },
      },
    },
  },
};

import { createI18n, useI18n } from 'vue-i18n';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';
import cs from './i18n/cs.ts';
import da from './i18n/da.ts';
import de from './i18n/de.ts';
import en from './i18n/en.ts';
import fr from './i18n/fr.ts';
import hi from './i18n/hi.ts';
import is from './i18n/is.ts';
import ja from './i18n/ja.ts';
import nb from './i18n/nb.ts';
import nl from './i18n/nl.ts';
import pl from './i18n/pl.ts';
import pt from './i18n/pt.ts';
import ro from './i18n/ro.ts';
import si from './i18n/si.ts';
import vi from './i18n/vi.ts';
const messages = { 
  cs,
  da,
  de,
  en,
  fr,
  hi,
  is,
  ja,
  nb,
  nl,
  pl,
  pt,
  ro,
  si,
  vi,
};
const i18n = new createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages,
});
vuetifyOpts.adapter = createVueI18nAdapter({ i18n, useI18n });

// Vuetify
import { createVuetify, } from "vuetify"
const vuetify = createVuetify(vuetifyOpts);

import { loadFonts } from './plugins/webfontloader'
loadFonts()

import NotFound from './components/NotFound.vue';
import EbtCards from './components/EbtCards.vue';
const routes = [
  { path: '/', component:EbtCards },
  { path: '/:context', component:EbtCards },
  { path: '/:context/:location(.*)*', component:EbtCards },
  { path: '/:bad_path(.*)*', component:NotFound },
]
import * as VueRouter from "vue-router";
const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes, 
})

var app = createApp(App);
app.use(pinia);
app.use(i18n);
app.use(vuetify);
app.use(router);;
app.mount('#app');

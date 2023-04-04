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

import { default as VuetifyOpts } from "./vuetify-opts.mjs";
const vuetifyOpts = VuetifyOpts.options();

import { createI18n, useI18n } from 'vue-i18n';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';
import { default as Messages } from './messages.mjs';
const messages = await Messages.MESSAGES;
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

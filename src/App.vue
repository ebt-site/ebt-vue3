<template>
  <v-app >
    <v-main >
      <v-app-bar flat 
        :extension-height="collapsed ? 0 : 40"
        :collapse="collapsed"
        density="compact"
      >
        <template v-if="collapsed">
          <v-btn icon @click="collapsed=false" class="pr-5">
            <v-icon icon="mdi-arrow-expand-left" />
          </v-btn>
        </template> <!-- collapsed -->
        <template v-if="!collapsed">
          <v-app-bar-title @click="collapsed=true" > 
            <div class="ebt-title">
              <v-icon icon="mdi-home" class="home-icon" size="24px"
                @click.stop="onHome"
              />
              <div>{{config.appName}}</div>
            </div>
          </v-app-bar-title>
          
          <v-menu location="left" attach v-if="narrowView">
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
              <v-btn icon @click.stop="onClickSettings">
                <v-icon icon="mdi-cog"/>
              </v-btn>
            </v-sheet>
          </v-menu>
          <div v-if="!narrowView" class="pr-3">
            <v-btn icon href="#/search" >
              <v-icon icon="mdi-magnify"/>
            </v-btn>
            <v-btn id='btn-settings' icon @click="onClickSettings">
              <v-icon icon="mdi-cog"/>
            </v-btn>
          </div>
        </template>
        <template v-if="!collapsed" v-slot:extension>
          <ebt-chips />
        </template> <!-- !collapsed -->
        <template v-if="settings.loaded">
          <audio 
            :ref="el => {clickElt = el}" preload=auto>
            <source type="audio/mp3" :src="'audio/click4.mp3'" />
            <p>{{$t('ebt.noHTML5')}}</p>
          </audio>
        </template>
      </v-app-bar>

      <v-sheet>
        <div>
          <ebt-processing />
          <Settings />
          <EbtCards v-if="settings?.cards?.length" />
          <!--router-view /-->
        </div>
      </v-sheet>

      <v-sheet class="gdrp" v-if="settings.showGdpr">
        {{$t('ebt.allowSettings')}}
        <a :href="privacyLink">{{$t('ebt.allowSettingsLink')}}</a>
        <v-icon icon="mdi-close-circle" 
          class="ml-2"
          @click="onClickGdrp"/>
      </v-sheet>

      <v-snackbar v-model="volatile.showAlertMsg" 
        color="alert" 
        height="300px"
        timeout=-1
      >
        <div class="alert-title"> 
          {{ alertTitle }}
          <v-btn color="alert"
            icon="mdi-close"
            @click="volatile.alert(null)"
          />
        </div>
        <div class="alert-body">
          <div class="alert-msg">{{ alertMsg }}</div>
          <div v-html="alertHtml" class="alert-html"/>
        </div>
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<script>
  import { default as HomeView } from './components/HomeView.vue';
  import EbtCards from './components/EbtCards.vue';
  import EbtChips from './components/EbtChips.vue';
  import Settings from './components/Settings.vue';
  import EbtProcessing from './components/EbtProcessing.vue';
  import { useSettingsStore } from './stores/settings.mjs';
  import { useVolatileStore } from './stores/volatile.mjs';
  import { useAudioStore } from './stores/audio.mjs';
  import { logger } from "log-instance/index.mjs";
  import { nextTick, ref } from "vue";

  export default {
    inject: ['config'],
    setup() {
      return {
        tabs: ref([]),
        clickElt: ref(undefined),
      }
    },
    data: ()=>({
      audio: useAudioStore(),
      settings: useSettingsStore(),
      volatile: useVolatileStore(),
      unsubSettings: undefined,
      collapsed: false,
    }),
    components: {
      HomeView,
      EbtCards,
      EbtChips,
      Settings,
      EbtProcessing,
    },
    methods: {
      onHome(evt) {
        let msg = 'App.onHome() ';
        let { volatile, audio, config } = this;
        audio.playBlock();

        let location = `${config.basePath}${config.homePath}`;
        window.location = location;
        volatile.ebtChips && nextTick(()=>volatile.ebtChips.focus());
        logger.debug(msg);
      },
      allowLocalStorage() {
        let { settings } = this;
        settings.saveSettings();
        logger.debug("allowLocalStorage()", settings);
      },
      onClickGdrp(evt) {
        let { audio, settings } = this;
        logger.debug('onClickGdrp', evt);
        settings.showGdpr = false;
        evt.preventDefault();
      },
      onClickSettings(evt) {
        let { volatile, audio } = this;
        let btn = document.getElementById('btn-settings');
        btn && btn.blur();
        volatile.showSettings = true;
        nextTick(()=>{
          let autofocus = document.getElementById('settings-autofocus');
          autofocus && autofocus.focus();
        });
      },
    },
    async mounted() {
      let msg = 'App.mounted() ';
      let { $t, audio, config, $vuetify, settings, $i18n, volatile, } = this;
      volatile.$t = $t;
      volatile.config = config;

      let { hash } = window.location;

      // wait for Settings to load
      await settings.loadSettings(config);
      nextTick(()=>{
        let { clickElt } = this;
        audio.clickElt = clickElt;
        let { audioVolume } = settings;
        clickElt.volume = audioVolume;
      });

      let wikiHash = hash.startsWith("#/wiki") ? hash : null;
      let wikiCard = wikiHash
        ? settings.pathToCard(wikiHash)
        : settings.pathToCard(config.homePath);
      logger.info(msg, {wikiCard});

      $vuetify.theme.global.name = settings.theme === 'dark' ? 'dark' : 'light';;
      $i18n.locale = settings.locale;
      this.unsubSettings = settings.$subscribe((mutation, state) => {
        $vuetify.theme.global.name = settings.theme === 'dark' ? 'dark' : 'light';;
        logger.debug("App.mounted() settings.subscribe()", 
          {mutation, state, settings});
        settings.saveSettings();
        $i18n.locale = settings.locale;
      });
      window.addEventListener('keydown', evt=>{
        let msg = `App.mounted().keydown:${evt.code}`;
        let { audio } = this;
        switch (evt.code) {
          case 'Home': this.onHome(evt); break;
          //default: console.log(msg, evt); break;
        }
      })
      window.addEventListener('focusin', evt=>{
        let msg = 'App.mounted().focusin';
        let { audio } = this;
        if (evt.target.id === 'ebt-chips') {
          audio.playBlock();
        } else {
          audio.playClick();
        }
      });
      let { activeElement } = document;
      logger.info(msg, {activeElement});
    },
    computed: {
      privacyLink(ctx) {
        let { config } = ctx;
        return config.privacyLink || "#/wiki/privacy";
      },
      alertHtml(ctx) {
        return ctx.volatile.alertHtml;
      },
      alertTitle(ctx) {
        let { $t } = ctx;
        let titleKey = ctx.volatile.alertMsg?.context || 'ebt.applicationError';
        return $t(titleKey);
      },
      alertMsg(ctx) {
        return ctx.volatile.alertMsg?.msg;
      },
      displayBox(ctx) {
        return ctx.volatile.displayBox.value;
      },
      narrowView(ctx) {
        let { displayBox } = ctx;
        return displayBox.w < 400;
      },
    },
  }
</script>
<style>
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
  min-width: 10em;
}
.v-toolbar--collapse {
  width: 50px !important;
  left: unset !important;
  right: 0px;
  border: 1pt solid rgba(var(--v-theme-toolbar), 0.5);
  border-bottom-right-radius: 0px;
  border-bottom-left-radius: 24px;
}
.ebt-nav-img {
  display: relative;
  height: 35px;
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
.v-app-bar.v-toolbar {
  background: linear-gradient(130deg, #000, rgb(var(--v-theme-toolbar)));
}
.app-menu-activator {
  padding-right: 10px;
}
.app-menu-items {
  display: flex;
  height: 50px !important;
  flex-flow: row nowrap ;
  border: 1px solid rgb(var(--v-theme-on-surface));
  border-radius: 10px !important;
  border-top-right-radius: 0px !important;
  background: rgba(var(--v-theme-surface), 0.5);
}
.alert-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: larger;
  font-variant-caps: all-small-caps;
  font-weight: 600;
  border-bottom: 1pt solid rgba(var(--v-theme-on-surface), 0.5);
}
.alert-body {
  min-height: 40px;
}
.alert-msg {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  line-height: 1.2em;
  max-width: 300px;
  text-overflow: '';
}
.alert-html{
  font-size: 11px;
  line-height: 1.2em;
  border-left: 1pt solid orange;
  padding-left: 1em;
}
.home-icon {
  margin-bottom: 0.2em;
  margin-right: 0.2em;
}
</style>


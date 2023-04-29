<template>
  <v-dialog v-model="volatile.showSettings" max-width=600
    scrollable
    @update:modelValue="onClose"
    >
    <v-sheet>
      <v-toolbar dense color="toolbar">
        <v-toolbar-title>
          <div>{{$t('ebt.settingsTitle')}}</div>
        </v-toolbar-title>
        <v-btn id="btn-settings-close" icon @click="clickClose">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-expansion-panels >
        <v-expansion-panel ><!--General-->
          <v-expansion-panel-title 
            v-if="volatile.showSettings"
            id="settings-autofocus"
            expand-icon="mdi-dots-vertical" collapse-icon="mdi-dots-horizontal"
            >
            {{$t('ebt.general')}}
            <v-spacer/>
            <div class="settings-summary">
              {{settings.maxResults}}
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-select v-model="settings.theme" :items="themes"
              :menu-icon="selectIcon"
              :label="$t('ebt.theme')"
            />
            <v-select v-model="settings.maxResults" 
              :menu-icon="selectIcon"
              :items="maxResultsItems"
              :label="$t('ebt.searchResults')"
            />
            <v-checkbox v-model="settings.alwaysShowLatestText" density="compact"
              :label="$t('ebt.alwaysShowLatestText')">
            </v-checkbox>
            <v-checkbox v-model="settings.showGdpr" density="compact"
              :label="$t('ebt.showGdpr')">
            </v-checkbox>
          </v-expansion-panel-text>
        </v-expansion-panel><!--General-->

        <v-expansion-panel><!--Languages-->
          <v-expansion-panel-title 
            expand-icon="mdi-dots-vertical" collapse-icon="mdi-dots-horizontal"
            >
            {{$t('ebt.languages')}}
            <v-spacer/>
            <div class="settings-summary">
              {{settings.locale.toUpperCase()}}
              {{settings.langTrans.toUpperCase()}}
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-select v-model="settings.locale" :items="languages.UI_LANGS" 
              :menu-icon="selectIcon"
              :label="$t('ebt.uiLanguage')"
            />
            <v-select v-model="settings.langTrans" :items="languages.VOICE_LANGS" 
              :menu-icon="selectIcon"
              :label="$t('ebt.transLanguage')"
            />
          </v-expansion-panel-text>
        </v-expansion-panel><!--Languages-->

        <v-expansion-panel><!--Text Layout-->
          <v-expansion-panel-title 
            expand-icon="mdi-dots-vertical" collapse-icon="mdi-dots-horizontal"
            >
            {{$t('ebt.textLayout')}}
            <v-spacer/>
            <div class="settings-summary">
              <span v-if="settings.showId">#</span>
              <span v-if="settings.showPali" class="ml-1">PLI</span>
              <span v-if="settings.showTrans" class="ml-1">
                {{settings.langTrans.toUpperCase()}}
              </span>
              <span v-if="settings.showReference" class="ml-1">
                {{settings.refLang.toUpperCase()}}
              </span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-checkbox v-model="settings.showPali" density="compact"
              :label="$t('ebt.showPaliText')"
            />
            <v-checkbox v-model="settings.showTrans" density="compact"
              :label="$t('ebt.showTransText')"
            />
            <v-checkbox v-model="settings.showReference" density="compact"
              :label="$t('ebt.showReference')"
            />
            <div v-if="settings.showReference">
              <v-select v-model="settings.refLang" :items="languages.REF_LANGS" 
                :menu-icon="selectIcon"
                :label="$t('ebt.refLanguage')"
              />
            </div>
            <v-divider class="mt-2 mb-2"/>
            <v-checkbox v-model="settings.fullLine" density="compact"
              :label="$t('ebt.showLineByLine')"
            />
            <v-checkbox v-model="settings.showId" density="compact"
              :label="$t('ebt.showTextSegmentIds')"
            />
          </v-expansion-panel-text>
        </v-expansion-panel><!--Text Layout-->

        <v-expansion-panel><!--Narrator-->
          <v-expansion-panel-title 
            expand-icon="mdi-dots-vertical" collapse-icon="mdi-dots-horizontal"
            >
            {{$t('ebt.reader')}}
            <v-spacer/>
            <div class="settings-summary">
              {{settings.vnameRoot}}
              {{settings.vnameTrans}}
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-select v-model="settings.vnameTrans" 
              :menu-icon="selectIcon"
              :items="langVoices(settings.langTrans, 'vnameTrans')"
              item-title="label"
              item-value="name"
              :label="settings.langTrans"
            />
            <v-select v-model="settings.vnameRoot" 
              :menu-icon="selectIcon"
              :items="langVoices(settings.langRoot, 'vnameRoot')"
              item-title="label"
              item-value="name"
              :label="settings.langRoot"
            />
          </v-expansion-panel-text>
        </v-expansion-panel><!--Narrator-->

        <v-expansion-panel><!--Audio-->
          <v-expansion-panel-title 
            expand-icon="mdi-dots-vertical" collapse-icon="mdi-dots-horizontal"
            >
            {{$t('ebt.audio')}}
            <v-spacer/>
            <div class="settings-summary">
              {{ipsItem.title}}
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-select id="ips-select" 
              :menu-icon="selectIcon"
              ref="sound-focus"
              @update:menu="onAudioUpdated"
              :items="ipsItems"
              class="ebt-select caption"
              v-model="settings.ips"
              :label="$t('ebt.bellSound')"
              :hint="ipsItem.hint"
              >
            </v-select>
            <v-checkbox v-model="settings.speakTranslation" density="compact"
              :label="$t('ebt.speakTranslation')"
            />
            <v-checkbox v-model="settings.speakPali" density="compact"
              :label="$t('ebt.speakPali')"
            />
            <v-slider v-model="settings.clickVolume" min=0 max=4 step=1 
              :label="$t('ebt.click')"
              @update:modelValue="onClickVolume"
              prepend-icon="mdi-volume-high"
            ></v-slider>
            <v-slider v-model="settings.blockVolume" min=0 max=4 step=1 
              :label="$t('ebt.homeSound')"
              @update:modelValue="onBlockVolume"
              prepend-icon="mdi-volume-high"
            ></v-slider>
            <v-slider v-model="settings.swooshVolume" min=0 max=4 step=1 
              :label="$t('ebt.swooshSound')"
              @update:modelValue="onSwooshVolume"
              prepend-icon="mdi-volume-high"
            ></v-slider>
            <template v-for="bell,i in ipsChoices">
              <audio v-if="bell.value" 
                :ref="el => {bellAudio[bell.value] = el}" preload=auto>
                <source type="audio/mp3" :src="bell.url.substring(1)" />
                <p>{{$t('ebt.noHTML5')}}</p>
              </audio>
              <!--v-btn @click="playBell(i)">
                {{bell.value}} 
                {{$t(`ebt.${bell.i18n}`)}}
              </v-btn-->
            </template>
          </v-expansion-panel-text>
        </v-expansion-panel><!--Audio-->

        <v-expansion-panel><!--Advanced-->
          <v-expansion-panel-title 
            expand-icon="mdi-dots-vertical" collapse-icon="mdi-dots-horizontal"
            >
            {{$t('ebt.advanced')}}
            <v-spacer/>
            <div class="settings-summary">
              <Version/>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-checkbox v-model="settings.highlightExamples" density="compact"
              :label="$t('ebt.highlightExamples')"
            />
            <div class='settings-confirm'>
              <Confirm 
                i18nButton='ebt.resetSettings'
                i18nTitle='ebt.clearSettings'
                i18nConfirm='ebt.reset'
                :confirm='resetDefaults'
              ></Confirm>
              <Confirm 
                i18nButton='ebt.clearSoundCache'
                i18nTitle='ebt.clearSoundCache'
                i18nConfirm='ebt.clear'
                :confirm='audio.clearSoundCache'
              ></Confirm>
            </div>
            <v-select v-model="settings.serverUrl" :items="servers" 
              :menu-icon="selectIcon"
              :label="$t('ebt.server')"
              :hint='serverHint'
            />
            <v-select v-model="settings.logLevel" :items="logLevels" 
              :menu-icon="selectIcon"
              :label="$t('ebt.logLevel')"
              :hint="settings.logLevel || 'info'"
            />
            <v-sheet class="settings-link">
              <a :href="githubUrl" target="_blank">
                {{$t('ebt.showGithub')}}
              </a>
            </v-sheet>
          </v-expansion-panel-text>
        </v-expansion-panel><!--Advanced-->
      </v-expansion-panels>
    </v-sheet>
  </v-dialog>
</template>

<script>
import { ref, nextTick, } from 'vue';
import { useSettingsStore } from "../stores/settings.mjs";
import { useVolatileStore } from "../stores/volatile.mjs";
import { useAudioStore } from "../stores/audio.mjs";
import { default as EbtSettings } from "../ebt-settings.mjs";
import { default as languages } from "../languages.mjs";
import { logger } from "log-instance";
import * as VOICES from "../auto/voices.json";
import Confirm from "./Confirm.vue";
import Version from "./Version.vue";
const maxResultsItems = [{
  title: "5",
  value: 5,
},{
  title: "10",
  value: 10,
},{
  title: "25",
  value: 25,
},{
  title: "50",
  value: 50,
}]


export default {
  inject: ['config'],
  setup() {
    const logLevels = [{
      title: 'Errors only',
      value: 'error',
    },{
      title: 'Warnings and errors',
      value: 'warn',
    },{
      title: 'Development information',
      value: 'info',
    },{
      title: 'Show all messages',
      value: 'debug',
    }];

    let data = {
      bellAudio: ref({}),
      host: ref(undefined),
      ipsChoices: EbtSettings.IPS_CHOICES,
      languages,
      logLevels,
      maxResultsItems,
      audio: useAudioStore(),
      settings: useSettingsStore(),
      volatile: useVolatileStore(),
      btnSettings: ref(undefined),
    }
    logger.debug("Settings.setup()", data.settings);
    return data;
  },
  components: {
    Confirm,
    Version,
  },
  mounted() {
    this.host = window.location.host;
    logger.debug("Settings.mounted()", this.host);
  },
  methods: {
    onClose() {
      let { volatile } = this;
      let btn = document.getElementById('btn-settings');
      btn && nextTick(()=>{
        btn.focus();
      });
    },
    onClickVolume() {
      let { audio } = this;
      audio.playClick();
    },
    onBlockVolume() {
      let { audio } = this;
      audio.playBlock();
    },
    onSwooshVolume() {
      let { audio } = this;
      audio.playSwoosh();
    },
    clickClose() {
      let { audio, volatile } = this;
      //audio.playClick();
      volatile.showSettings = false;
      this.onClose();
    },
    resetDefaults() {
      let { settings, volatile } = this;
      settings.clear();
      volatile.showSettings = false;
      logger.warn("Settings.resetDefaults()", Object.assign({}, settings));
      volatile.setRoute("#/home");
      nextTick(()=>window.location.reload());
    },
    langVoices(lang, vnameKey) {
      let { settings } = this;
      let voices = VOICES.default;
      let vname = settings[vnameKey];
      let langVoices = voices.filter(v=>v.langTrans===lang);
      if (!langVoices.some(v=>v.name === vname)) {
        this.$nextTick(()=> {
          settings[vnameKey] = langVoices[0].name;
        });
      }
      return langVoices;
    },
    playBell(ips=this.settings.ips) {
      let { settings, ipsChoices, bellAudio } = this;
      let ipsChoice = ipsChoices.filter(c=>c.value===ips)[0];
      let audio = bellAudio[`${ips}`];
      logger.info('playBell', bellAudio, ips);
      if (audio) {
        let msg = `playBell(${ips}:${ipsChoice.i18n}) => ${ipsChoice.url}`;
        audio.play()
          .then(res=>logger.info(msg))
          .catch(e=>logger.info(e));
      } else {
        logger.warn(`playBell(${ips}) NO AUDIO:`, ipsChoice);
      }
    },
    onAudioUpdated(open) {
      let { settings } = this;
      logger.info(`onAudioUpdate`, open, settings.ips);
      !open && this.playBell();
    },

  },
  computed: {
    githubUrl: ctx=>{
      let { repository, account } = ctx.config.github;
      return `https://github.com/${account}/${repository}`;
    },
    selectIcon: ctx=>"mdi-menu-open",
    servers: ctx=>{
      let { settings, host } = ctx;
      logger.debug("Settings.servers", settings, host);
      return settings.servers.filter(s => {
        return host.startsWith("localhost") || !/localhost/.test(s);
      });
    },
    serverHint: ctx=>{
      let { settings } = ctx;
      let server = settings.server;
      return server?.hint || server?.title;
    },
    themes: (ctx)=>{
      let { $t=(s=>s) } = ctx;
      let result = [{
        title: $t('ebt.themeDark'),
        value: "dark",
      },{
        title: $t('ebt.themeLight'),
        value: "light",
      }];
      return result;
    },
    ipsItems: (ctx) => ctx.ipsChoices.map(ic=>({
      value: ic.value,
      title: ctx.$t(`ebt.${ic.i18n}`),
      hint: ctx.$t(`ebt.${ic.i18n}Hint`),
    })),
    ipsItem: (ctx) => {
      let { ipsItems, settings, } = ctx;
      let ipsItem = ipsItems.filter(item=>item.value === settings.ips)[0];
      return ipsItem;
    },
  },
}
</script>

<style scoped>
.settings-clear {
  margin-bottom: 1em;
  text-align: "center";
}
.settings-caption {
  margin-top: -5px;
  margin-left: 3px;
}
.settings-summary {
  text-align: right;
  font-size: smaller;
}
.settings-link {
  margin: 0.7rem;
}
.settings-confirm {
  display: flex;
  flex-flow: column;
}
</style>

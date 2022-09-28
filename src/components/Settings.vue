<template>
  <v-dialog v-model="dialog" max-width=600>
    <template v-slot:activator="{ props }">
      <v-btn icon="mdi-cog" v-bind="props" 
        :title="$t('ebt.settingsTitle')"/> 
    </template>
    <v-sheet>
      <v-toolbar dense color="toolbar">
        <v-toolbar-title>
          <div>{{$t('ebt.settingsTitle')}}</div>
        </v-toolbar-title>
        <v-btn icon @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-expansion-panels >
        <v-expansion-panel ><!--General-->
          <v-expansion-panel-title 
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
            <v-select v-model="settings.serverUrl" :items="servers" 
              :menu-icon="selectIcon"
              :label="$t('ebt.server')"
              :hint='serverHint'
            />
            <v-select v-model="refLogger.logLevel" :items="logLevels" 
              :menu-icon="selectIcon"
              :label="$t('ebt.logLevel')"
              :hint="refLogger.logLevel || 'info'"
            />
            <v-card>
              <v-card-text>
              <a :href="githubUrl" target="_blank">
                {{$t('ebt.showGithub')}}
              </a>
              </v-card-text>
            </v-card>
            <v-dialog 
              v-model="isClearSettings">
              <template v-slot:activator="{ on, attrs }">
                <v-btn class="settings-clear" 
                  @click="openClearSettings"
                  variant="outlined"
                  >
                  {{$t('ebt.resetSettings')}}
                </v-btn>
              </template>
              <v-card max-width="30em" location="center">
                <v-card-title>
                  <div style="border-bottom: 1pt solid red">
                    {{$t('ebt.clearSettings')}}
                  </div>
                </v-card-title>
                <v-card-actions>
                  <v-btn v-if="isClearSettings" @click="isClearSettings=false">
                    {{$t('auth.cancel')}}
                  </v-btn>
                  <v-spacer/>
                  <v-btn @click="resetDefaults" color="red">
                    {{$t('ebt.reset')}}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-expansion-panel-text>
        </v-expansion-panel><!--Advanced-->
      </v-expansion-panels>
    </v-sheet>
  </v-dialog>
</template>

<script>
import { ref, reactive, onMounted, computed, } from 'vue';
import { useSettingsStore } from "../stores/settings";
import { default as EbtSettings } from "../ebt-settings.mjs";
import { default as languages } from "../languages.mjs";
import { logger } from "log-instance";
import * as VOICES from "../auto/voices.json";
import Version from "./Version.vue";
import * as EBT_REPO from "../../ebt-repo.json";
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
  setup() {
    const refLogger = ref(logger);
    const bellAudio = ref({});
    const ipsChoices = EbtSettings.IPS_CHOICES;
    const dialog = ref(false);
    const settings = useSettingsStore();
    const host = ref(undefined);
    const isClearSettings = ref(false);
    const logLevels = [{
      title: 'Errors only',
      value: 'error',
    },{
      title: 'Warnings and errors',
      value: 'warn',
    },{
      title: 'Verbose',
      value: 'info',
    },{
      title: 'Show all messages',
      value: 'debug',
    }];

    console.log("Settings.setup()", settings);

    return {
      bellAudio,
      isClearSettings,
      dialog,
      host,
      ipsChoices,
      languages,
      logLevels,
      maxResultsItems,
      refLogger,
      settings,
    }
  },
  components: {
    Version,
  },
  data: function() {
    return {};
  },
  mounted() {
    this.host = window.location.host;
    console.log("Settings.mounted()", this.host);
  },
  methods: {
    openClearSettings() {
      this.isClearSettings = !this.isClearSettings;
    },
    resetDefaults() {
      let { settings } = this;
      settings.clear();
      this.dialog = false;
      logger.info("Settings.resetDefaults()", settings);
      window.location.reload();
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
      let { repository, account } = EBT_REPO;
      return `https://github.com/${account}/${repository}`;
    },
    selectIcon: ctx=>"mdi-menu-open",
    servers: ctx=>{
      let { settings, host } = ctx;
      console.log("Settings.servers", settings, host);
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
  margin-top: 4pt;
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
</style>

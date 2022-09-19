<template>
  <!--v-row justify="center"-->
    <v-dialog v-model="dialog" max-width=600>
      <template v-slot:activator="{ props }">
        <v-btn v-if="settings.isLocalStorage" icon="mdi-cog" v-bind="props" 
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
                <Version/>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-select v-model="settings.theme" :items="themes" 
                :label="$t('ebt.theme')"
              />
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
                :label="$t('ebt.uiLanguage')"
              />
              <v-select v-model="settings.langTrans" :items="languages.VOICE_LANGS" 
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
                :items="langVoices(settings.langTrans, 'vnameTrans')"
                item-title="label"
                item-value="name"
                :label="settings.langTrans"
              />
              <v-select v-model="settings.vnameRoot" 
                :items="langVoices(settings.langRoot, 'vnameRoot')"
                item-title="label"
                item-value="name"
                :label="settings.langRoot"
              />
            </v-expansion-panel-text>
          </v-expansion-panel><!--Narrator-->

          <v-expansion-panel><!--Search Results-->
            <v-expansion-panel-title 
              expand-icon="mdi-dots-vertical" collapse-icon="mdi-dots-horizontal"
              >
              {{$t('ebt.searchResults')}}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list>
                <v-list-item>
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel><!--Search Results-->

          <v-expansion-panel><!--Audio-->
            <v-expansion-panel-title 
              expand-icon="mdi-dots-vertical" collapse-icon="mdi-dots-horizontal"
              >
              {{$t('ebt.audio')}}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-select id="ips-select" 
                ref="sound-focus"
                @update:menu="onAudioUpdated"
                :items="ipsItems"
                class="ebt-select caption"
                v-model="settings.ips"
                :label="$t('ebt.bellSound')"
                :hint="ipsHint"
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
              Advanced
              <v-spacer/>
              <div class="settings-summary">
                {{settings.server?.title}}
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-select v-model="settings.serverUrl" :items="servers()" 
                :label="$t('ebt.server')"
                :hint='serverHint()'
              />
              <v-select v-model="refLogger.logLevel" :items="logLevels" 
                :label="$t('ebt.logLevel')"
                :hint="refLogger.logLevel || 'info'"
              />
              <v-btn @click="resetDefaults" variant="outlined" >
                Restore Defaults
              </v-btn>
            </v-expansion-panel-text>
          </v-expansion-panel><!--Advanced-->
        </v-expansion-panels>
      </v-sheet>
    </v-dialog>
  <!--/v-row-->
</template>

<script setup>
import { ref, reactive, onMounted, computed, } from 'vue';
import { useSettingsStore } from "../stores/settings";
import { default as EbtSettings } from "../ebt-settings.mjs";
import { logger } from "log-instance";
import Version from "./Version.vue";

const refLogger = ref(logger);
const bellAudio = ref({});
const ipsChoices = EbtSettings.IPS_CHOICES;
const dialog = ref(false);
const settings = useSettingsStore();
import { default as languages } from "../languages.mjs";
const host = ref(undefined);
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
}]

function servers() {
  return settings.servers.filter(s => {
    return host.value.startsWith("localhost") || !/localhost/.test(s);
  });
}

function serverHint() {
  let server = settings.server;
  return server?.hint || server?.title;
}

function resetDefaults() {
  settings.clear();
  dialog.value = false;
  logger.info("Settings.resetDefaults()", settings);
}


function playBell(ips=settings.ips) {
  let ipsChoice = ipsChoices.filter(c=>c.value===ips)[0];
  let audio = bellAudio.value[`${ips}`];
  logger.info('playBell', bellAudio.value, ips);
  if (audio) {
    let msg = `playBell(${ips}:${ipsChoice.i18n}) => ${ipsChoice.url}`;
    audio.play()
      .then(res=>logger.info(msg))
      .catch(e=>logger.info(e));
  } else {
    logger.warn(`playBell(${ips}) NO AUDIO:`, ipsChoice);
  }
}

function onAudioUpdated(open) {
  //logger.info(`onAudioUpdate`, open, settings.ips);
  !open && playBell();
}

onMounted((ctx)=>{
  host.value = window.location.host;
  logger.info('Settings.mounted() settings:', settings, ctx);
});


</script><!--setup-->
<script>
import * as VOICES from "../auto/voices.json";
import { useSettingsStore } from "../stores/settings";

export default {
  setup() {
    const settings = useSettingsStore();

    return {
      settings,
    }
  },
  data: function() {
    return {};
  },
  methods: {
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
  },
  computed: {
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
    ipsHint: (ctx) => {
      let { ipsItems, settings, } = ctx;
      let ipsItem = ipsItems.filter(item=>item.value === settings.ips)[0];
      return ipsItem?.hint;
    },
  },
}
</script>

<style scoped>
.settings-caption {
  margin-top: -5px;
  margin-left: 3px;
}
.settings-summary {
  text-align: right;
  font-size: smaller;
}
</style>

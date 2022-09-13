<template>
  <!--v-row justify="center"-->
    <v-dialog v-model="dialog" max-width=600>
      <template v-slot:activator="{ props }">
        <v-btn v-if="settings.isLocalStorage" icon="mdi-cog" v-bind="props" 
          :title="$t('ebt.settingsTitle')"/> 
      </template>
      <v-sheet>
        <v-toolbar dense color="primary">
          <v-toolbar-title>
            <div>{{$t('ebt.settingsTitle')}}</div>
            <div class="text-caption settings-caption"><Version/></div>
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
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-select v-model="settings.locale" :items="languages" 
                :label="$t('ebt.uiLanguage')"
              />
            </v-expansion-panel-text>
          </v-expansion-panel><!--Languages-->

          <v-expansion-panel><!--Text Layout-->
            <v-expansion-panel-title 
              expand-icon="mdi-dots-vertical" collapse-icon="mdi-dots-horizontal"
              >
              {{$t('ebt.textLayout')}}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
            </v-expansion-panel-text>
          </v-expansion-panel><!--Text Layout-->

          <v-expansion-panel><!--Narrator-->
            <v-expansion-panel-title 
              expand-icon="mdi-dots-vertical" collapse-icon="mdi-dots-horizontal"
              >
              {{$t('ebt.reader')}}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
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
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-select v-model="settings.serverUrl" :items="servers()" 
                :label="$t('ebt.server')"
                :hint='serverHint()'
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
import Version from "./Version.vue";

const bellAudio = ref({});
const ipsChoices = EbtSettings.IPS_CHOICES;
const dialog = ref(false);
const settings = useSettingsStore();
const host = ref(undefined);
const languages = [{
  value: 'en',
  title: 'English', 
},{
  value:'de',
  title:'German - Deutsch',
}];

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
  console.log("Settings.resetDefaults()", settings);
}

function playBell(ips=settings.ips) {
  let ipsChoice = ipsChoices.filter(c=>c.value===ips)[0];
  let audio = bellAudio.value[`${ips}`];
  console.log('playBell', bellAudio.value, ips);
  if (audio) {
    let msg = `playBell(${ips}:${ipsChoice.i18n}) => ${ipsChoice.url}`;
    audio.play()
      .then(res=>console.log(msg))
      .catch(e=>console.log(e));
  } else {
    console.warn(`playBell(${ips}) NO AUDIO:`, ipsChoice);
  }
}

function onAudioUpdated(open) {
  //console.log(`onAudioUpdate`, open, settings.ips);
  !open && playBell();
}

onMounted(()=>{
  host.value = window.location.host;
  console.log('Settings.mounted() settings:', settings);
});


</script>
<script>
export default {
  data: function() {
    return {};
  },
  methods: {
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
  margin-top: -7px;
  margin-left: 3px;
}
</style>


<template>
  <!--v-row justify="center"-->
    <v-dialog v-model="dialog">
      <template v-slot:activator="{ props }">
        <v-btn v-if="settings.isLocalStorage" icon="mdi-cog" v-bind="props" 
          :title="$t('ebt.settingsTitle')"/> 
      </template>
      <v-card>
        <v-toolbar compact>
          <v-toolbar-title>
            <div>{{$t('ebt.settingsTitle')}}</div>
            <div class="text-caption"><Version/></div>
          </v-toolbar-title>
          <v-spacer/>
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-list class="mx-auto" max-width="600">
          <v-list-item>
            <v-list-item-title>
              {{$t('ebt.audio')}}
            </v-list-item-title>
            <v-list-item-subtitle>
              <v-container>
                <v-row dense>
                  <v-col >
                    <v-select id="ips-select" 
                      ref="sound-focus"
                      @update:menu="onAudioUpdated"
                      :items="ipsItems"
                      class="ebt-select caption"
                      v-model="settings.ips"
                      >
                    </v-select>
                    {{bellAudio}}
                    <template v-for="bell,i in ipsChoices">
                      {{JSON.stringify({i, bell})}}
                      <audio v-if="bell.value" 
                        :ref="el => {bellAudio[i] = el}" preload=auto>
                        <source type="audio/mp3" :src="bell.url.substring(1)" />
                        <p>{{$t('ebt.noHTML5')}}</p>
                      </audio>
                      <v-btn @click="playBell(i)">
                        {{bell.value}} 
                        {{$t(`ebt.${bell.i18n}`)}}
                      </v-btn>
                    </template>
                  </v-col>
                </v-row>
              </v-container>
            </v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>
              {{$t('ebt.server')}}
            </v-list-item-title>
            <v-list-item-subtitle>
              <v-container>
                <v-row dense>
                  <v-col >
                    <v-select v-model="settings.serverUrl" :items="servers()" 
                      :hint='settings.serverUrl'
                    />
                  </v-col>
                </v-row>
              </v-container>
            </v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>
              {{$t('ebt.theme')}} 
            </v-list-item-title>
            <v-list-item-subtitle>
              <v-container fluid>
                <v-row dense>
                  <v-col>
                    <v-select v-model="settings.theme" :items="themes" />
                  </v-col>
                </v-row>
              </v-container>
            </v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>
              {{$t('ebt.languages')}}
            </v-list-item-title>
            <v-list-item-subtitle>
              <v-container fluid>
                <v-row dense>
                  <v-col>
                    <v-select v-model="settings.locale" :items="languages" />
                  </v-col>
                </v-row>
              </v-container>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <v-expansion-panels>
          <v-expansion-panel >
            <v-expansion-panel-title expand-icon="mdi-dots-vertical">
              Advanced
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-btn @click="resetDefaults" variant="outlined" >
                Restore Defaults
              </v-btn>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
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

function resetDefaults() {
  settings.clear();
  dialog.value = false;
  console.log("Settings.resetDefaults()", settings);
}

function playBell(ips=settings.ips) {
  let ipsChoice = ipsChoices[ips];
  let audio = bellAudio.value[ips.value];
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
  console.log(`onAudioUpdate`, open, settings.ips);
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
    })),
  },
}
</script>

<style scoped>
</style>

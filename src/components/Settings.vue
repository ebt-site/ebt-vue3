
<template>
  <!--v-row justify="center"-->
    <v-dialog v-model="dialog">
      <template v-slot:activator="{ props }">
        <v-btn v-if="settings.isLocalStorage" icon="mdi-cog" v-bind="props" 
          :title="$t('scv.settingsTitle')"/> 
      </template>
      <v-card>
        <v-toolbar compact>
          <v-toolbar-title>
            <div>{{$t('scv.settingsTitle')}}</div>
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
              {{$t('scv.server')}}
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
              {{$t('scv.theme')}} 
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
              {{$t('scv.languages')}}
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
import Version from "./Version.vue";

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
  computed: {
    themes: (ctx)=>{
      let { $t=(s=>s) } = ctx;
      let result = [{
        title: $t('scv.themeDark'),
        value: "dark",
      },{
        title: $t('scv.themeLight'),
        value: "light",
      }];
      return result;
    },
  },
}
</script>

<style scoped>
</style>

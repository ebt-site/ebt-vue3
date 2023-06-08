<template>
  <v-dialog v-model="showDialog" class="pb-5">
    <template v-slot:activator="{ on, attrs }">
      <v-btn class="toggle-btn" 
        @click="toggleDialog"
        variant="outlined"
        >
        {{$t(i18nButton)}}
      </v-btn>
    </template>
    <v-card max-width="30em" location="center">
      <v-card-title>
        <div style="border-bottom: 1pt solid red">
          {{$t(i18nTitle)}}
        </div>
      </v-card-title>
      <v-card-actions>
        <v-btn @click="clickCancel">
          {{$t('auth.cancel')}}
        </v-btn>
        <v-spacer/>
        <v-btn @click="clickConfirm" color="red">
          {{$t(i18nConfirm)}}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref } from 'vue';
import { useAudioStore } from '../stores/audio.mjs';
import { logger } from "log-instance/index.mjs";

export default {
  props: {
    i18nButton: { type: String, default:'i18nButton' },
    i18nTitle: { type: String, default:'i18nTitle' },
    i18nConfirm: { type: String, default:'i18nConfirm' },
    confirm: { type: Function, required:true },
  },
  setup() {
    return {
      showDialog: ref(false),
      audio: useAudioStore(),
    }
  },
  methods: {
    toggleDialog() {
      let { audio } = this;
      audio.playClick();
      this.showDialog = !this.showDialog;
    },
    clickCancel() {
      let { audio } = this;
      audio.playClick();
      this.showDialog = false;
    },
    clickConfirm() {
      let { audio } = this;
      audio.playClick();
      this.showDialog = false;
      this.confirm();
    },
  },
}
</script>

<style scoped>
.toggle-btn {
  margin-bottom: 1em;
  text-align: "center";
}
</style>

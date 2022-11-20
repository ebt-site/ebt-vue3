<template>
  <v-dialog v-model="processing" class="ebt-processing-overlay">
    <v-card loading="true" class="ebt-processing">
      <v-card-title>
        {{$t('ebt.processing')}}
        {{volatile.waiting}}
      </v-card-title>
      <v-card-text>
        <div class="text-center">
          <v-progress-circular 
            indeterminate 
            width=3
            size=30
            color="progress1" 
            bg-color="progress2"
            class=""
          />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useVolatileStore } from '../stores/volatile.mjs';

export default {
  components: {
  },
  data () {
    let volatile = useVolatileStore();
    return {
      volatile,
    }
  },
  methods: {
  },
  computed: {
    processing() {
      let { volatile } = this;
      return volatile.waiting > 0;
    },
  },
}
</script>
<style>
.ebt-processing {
  border: 2px solid rgb(var(--v-theme-progress1));
  width: 15em;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 5px;
}
.ebt-processing-overlay {
  height: 100%;
  width: 100%;
  background: rgb(0,0,0,0.1);
  backdrop-filter: blur(1px);
}
</style>

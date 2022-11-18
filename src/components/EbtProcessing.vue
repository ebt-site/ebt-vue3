<template>
  <v-dialog v-model="volatile.waiting" class="ebt-processing">
    <v-card>
      <v-card-title>
        {{$t('ebt.processing')}}
        {{volatile.waiting}}
      </v-card-title>
      <v-card-text>
        <div class="text-center">
          <v-progress-circular 
            indeterminate 
            width=7
            size=70
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
      let { $store } = this;
      return 1 || $store && $store.state.ebt.processing;
    },
  },
}
</script>
<style>
.ebt-processing {
  height: 100%;
  width: 100%;
  background: rgb(0,0,0,0.1);
  backdrop-filter: blur(1px);
}
</style>

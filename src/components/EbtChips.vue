<template>
  <div class="chip-container">
    <v-chip-group v-model="opened">
      <div v-for="card in settings.cards">
        <v-chip variant="outlined" 
          :prepend-icon="card.icon"
          closable close-icon="mdi-close" 
          @click="clickChip(card)"
          draggable
          filter
          filter-icon="mdi-check"
          color="chip">
          {{card.chipTitle($t)}}
        </v-chip>
      </div>
    </v-chip-group>
  </div>
</template>

<script>
  import { useSettingsStore } from '../stores/settings';
  import { ref } from "vue";

  export default {
    setup() {
      const settings = useSettingsStore();
      return {
        settings,
      }
    },
    methods: {
      clickChip: (card) => {
        card.isOpen = !card.isOpen;
      },
    },
    computed: {
      opened: (ctx) => {
        let { settings } = ctx;
        return settings.cards.reduce((a,v,i) => {
          if (v.isOpen) {
            a.push(i);
          }
          return a;
        }, []);
      },
    },
  }
</script>
<style scoped>
  .chip-container {
    display: flex;
    flex-direction: column;
    min-height: 32px;
  }
</style>

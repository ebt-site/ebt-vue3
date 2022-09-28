<template>
  <div class="chip-container">
    <v-chip-group v-model="opened">
      <div v-for="card in settings.cards" :key="card.id">
        <v-chip variant="outlined" 
          ref="chip-close"
          :prepend-icon="card.icon"
          @click="clickChip(card.id, settings.cards)"
          draggable
          :rounded="card.isOpen ? 0 : 1"
          color="chip"
        >
          <span class="mr-2">{{card.chipTitle($t)}}</span>
          <v-icon icon="mdi-close-circle chip-close"
            v-if="settings.cards.length > 1"
            size="small"
            @click="clickChipClose(card, settings)"
          />
        </v-chip>
      </div>
    </v-chip-group>
  </div>
</template>

<script>
  import { default as EbtCard } from '../ebt-card.mjs';
  import { useSettingsStore } from '../stores/settings';
  import { ref, nextTick } from "vue";

  export default {
    setup() {
      const settings = useSettingsStore();

      return {
        settings,
      }
    },
    methods: {
      updateActive: (evt) => {
        console.log(`updateActive`, evt);
      },
      clickChip: (id, cards) => {
        nextTick(()=>{
          let card = cards.find(c=>c.id === id);
          if (card) {
            console.debug(`clickChip toggling card ${id}`);
            card.isOpen = !card.isOpen;
          } else {
            console.debug(`clickChip toggling card ${id} (IGNORED)`);
          }
        });
      },
      clickChipClose: (card, settings) => {
        let { cards } = settings;
        console.debug(`clickChipClose removing card ${card.id}`);
        nextTick(() => settings.removeCard(card));
      },
    },
    computed: {
      opened: {
        get: (ctx)=>{
          let { settings } = ctx;
          return settings.cards.reduce((a,v,i) => {
            if (v.isOpen) {
              a.push(i);
            }
            return a;
          }, []);
          },
        set: (value)=>{ 
          // do nothing
        },
      },
    },
  }
</script>
<style scoped>
  .chip-container {
    display: flex;
    flex-direction: column;
    min-height: 32px;
    margin-left: 1.0rem;
  }
  .chip-close {
    margin-right: -0.4em;
  }
</style>

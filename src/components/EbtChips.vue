<template>
  <div class="chip-container">
    <v-chip-group v-model="filteredChips" column>
      <div v-for="card in settings.cards" :key="card.id">
        <v-chip 
          :prepend-icon="card.icon"
          @click="onClick(card.id, settings.cards)"
          draggable
          @dragstart="startDrag($event, card)"
          @drop="onDrop($event, card, settings)"
          @dragover.prevent
          @dragenter.prevent
          :rounded="card.isOpen ? 0 : 1"
          :class="card.isOpen ? 'chip-open' : 'chip-closed'"
        >
          <div class="chip-title mr-2">{{card.chipTitle($t)}}</div>
          <v-icon icon="mdi-close-circle chip-close"
            v-if="!card.isOpen && settings.cards.length > 1"
            size="small"
            @click="onClose(card, settings)"
          />
        </v-chip>
      </div>
    </v-chip-group>
  </div>
</template>

<script>
  import { default as EbtCard } from '../ebt-card.mjs';
  import { useSettingsStore } from '../stores/settings';
  import { useVolatileStore } from '../stores/volatile';
  import { ref, nextTick } from "vue";

  export default {
    setup() {
      const settings = useSettingsStore();
      const volatile = useVolatileStore();

      return {
        settings,
        volatile,
      }
    },
    methods: {
      startDrag(evt, card) {
        evt.dataTransfer.dropEffect = 'move'
        evt.dataTransfer.effectAllowed = 'move'
        evt.dataTransfer.setData('srcCardId', card.id)
      },
      onDrop(evt, dstCard, settings) {
        let { cards } = settings;
        const srcCardId = evt.dataTransfer.getData('srcCardId')
        const srcIndex = cards.findIndex(elt => elt.id === srcCardId);
        const dstIndex = cards.findIndex(elt => elt === dstCard);
        settings.moveCard(srcIndex, dstIndex);
      },
      updateActive: (evt) => {
        console.log(`updateActive`, evt);
      },
      onClick: async (id, cards) => {
        const volatile = await useVolatileStore();
        let card = cards.find(c=>c.id === id);
        card && nextTick(()=>{ // wait for card to show
          console.debug(`onClick toggling card ${id}`);
          card.isOpen = !card.isOpen;
          card.isOpen && nextTick(()=>{ // wait for Vue to settle
            let topAnchor = document.getElementById(card.topAnchor);
            let titleAnchor = document.getElementById(card.titleAnchor);
            topAnchor && topAnchor.scrollIntoView({
              block: "start",
              behavior: "smooth",
            });
          });
        });
      },
      onClose: (card, settings) => {
        let { cards } = settings;
        console.debug(`onClose removing card ${card.id}`);
        nextTick(() => settings.removeCard(card));
      },
    },
    computed: {
      filteredChips: {
        get: (ctx)=>{
          return [];
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
  .chip-title {
    display: inline-block;
    overflow: hidden;
    max-width:5em;
    text-overflow: ellipsis;
  }
  .chip-open {
    border-bottom: 2pt solid #ff9933;
  }
  .chip-closed {
  }
</style>

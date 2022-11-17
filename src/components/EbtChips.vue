<template>
  <div class="chip-container">
    <v-chip-group v-model="filteredChips" column>
      <div v-for="card in settings.cards" :key="card.id">
        <v-chip 
          :prepend-icon="card.icon"
          @click="onClickChip(card, settings.cards)"
          draggable
          @dragstart="startDrag($event, card)"
          @drop="onDrop($event, card, settings)"
          @dragover.prevent
          @dragenter.prevent
          :rounded="card.isOpen ? 0 : 1"
          :class="chipClass(card)"
        >
          <div class="chip-title">{{card.chipTitle($t)}}</div>
          <v-icon icon="mdi-trash-can-outline chip-close"
            v-if="closable(card, settings)"
            size="small"
            class="ml-2"
            @click="onClose(card, settings)"
          />
        </v-chip>
      </div>
    </v-chip-group>
  </div>
</template>

<script>
  import { default as EbtCard } from '../ebt-card.mjs';
  import { useSettingsStore } from '../stores/settings.mjs';
  import { useVolatileStore } from '../stores/volatile.mjs';
  import { ref, nextTick } from "vue";
  import { logger } from "log-instance";

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
        logger.info(`updateActive`, evt);
      },
      onClickChip: async (card, cards) => {
        const settings = await useSettingsStore();
        let cardHash = card.routeHash();
        if (cardHash !== window.location.hash) {
          window.location.hash = cardHash;
          return;
        }
        if (card.isOpen) {
          let scrolled = await settings.scrollToCard(card);
          if (!scrolled) {
            card.isOpen = false;
          }
        } else {
          card.isOpen = true;
          nextTick(() => settings.scrollToCard(card));
        }
      },
      onClose: (card, settings) => {
        let { cards } = settings;
        logger.info(`onClose removing card ${card.id}`);
        nextTick(() => settings.removeCard(card));
      },
      closable: (card, settings) => {
        const IS_PHONE = 1; // save space for iPhone
        return !IS_PHONE && settings.cards.length > 1
          ? !card.isOpen && card.context !== EbtCard.CONTEXT_HOME
          : false;
      },
      chipClass: (card) => {
        let chipClass = [];

        card.context === EbtCard.CONTEXT_HOME && chipClass.push('chip-home');
        chipClass.push(card.isOpen ? 'chip-open' : 'chip-closed');
        return chipClass.join(' ');
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
  .chip-title {
    display: inline-block;
    overflow: hidden;
    max-width: 80px;
    text-overflow: ellipsis;
  }
  .chip-open {
    border-bottom: 2pt solid #ff9933;
  }
  .chip-closed {
  }
  .chip-close {
    margin-right: -0.4em;
  }
  .chip-home {
    padding-right: 6pt;
  }
</style>

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
          :class="chipClass(card)"
        >
          <div class="chip-title">{{card.chipTitle($t)}}</div>
          <v-icon icon="mdi-close-circle chip-close"
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
  import { useSettingsStore } from '../stores/settings';
  import { useVolatileStore } from '../stores/volatile';
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
      onClick: async (id, cards) => {
        const volatile = await useVolatileStore();
        const settings = await useSettingsStore();
        let card = cards.find(c=>c.id === id);
        if (!settings.scrollToElementId(card.topAnchor)) {
        }
        card && nextTick(()=>{ // wait for card to show
          if (settings.scrollToElementId(card.topAnchor)) {
          } else {
          }

          /*
          logger.info(`onClick toggling card ${id}`);
          if ((card.isOpen = !card.isOpen)) {
            window.location.hash = `#${card.route}`;
            nextTick(()=>{ // wait for Vue to settle
              let anchor = document.getElementById(card.topAnchor);
              console.log('scrolling to', {anchor, cardAnchor} );
              anchor && anchor.scrollIntoView({
                block: "start",
                behavior: "smooth",
              });
            });
          } else {
            let card = cards.find(card => card.isOpen);
            if (card) {
              let cardAnchor = card..topAnchor;
              let cardRoute = card.route;
              logger.info(`onClick showing open card`, {cardAnchor, cardRoute});
              //window.location.hash = `#${cardAnchor}`;
            }
          }
          */
        });
      },
      onClose: (card, settings) => {
        let { cards } = settings;
        logger.info(`onClose removing card ${card.id}`);
        nextTick(() => settings.removeCard(card));
      },
      closable: (card, settings) => {
        return settings.cards.length > 1
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
  .chip-home {
    padding-right: 6pt;
  }
</style>

<template>
  <div id="ebt-chips" 
    class="chip-container" tabindex=0
    @keydown.tab.exact.prevent="onTab"
    @keydown.right.exact.prevent="onNextChip(1)"
    @keydown.left.exact.prevent="onNextChip(-1)"
    @keydown.space.exact.prevent="onSpace"
    @keydown.enter.exact.prevent="onEnter"
  >
    <v-chip-group v-model="filteredChips" column>
      <div v-for="card in settings.cards" :key="card.id">
        <v-chip 
          :prepend-icon="card.icon"
          @click="onClickChip(card, settings.cards)"
          draggable
          tabindex=-1
          @dragstart="startDrag($event, card)"
          @drop="onDrop($event, card, settings)"
          @dragover.prevent
          @dragenter.prevent
          :rounded="0"
          :class="chipClass(card, volatile)"
          :title="card.chipTitle()"
        >
          <div class="chip-title">{{card.chipTitle($t)}}</div>
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
    mounted() {
      let { volatile } = this;
      volatile.ebtChips = document.getElementById('ebt-chips');
    },
    methods: {
      onSpace(evt) {
        const msg = 'App.onSpace() ';
        console.log(msg);
      },
      onEnter(evt) {
        const msg = 'App.onEnter() ';
        console.log(msg);
      },
      onNextChip(delta) {
        let msg = `EbtChips.onNextChip(${delta})`;
        let { volatile, settings } = this;
        let { routeCard } = volatile;
        let { cards } = settings;
        let nextIndex = 0;

        if (routeCard) {
          let index = cards.indexOf(routeCard);
          nextIndex = (index + delta + cards.length) % cards.length;
        }
        let card = cards[nextIndex];
        volatile.setRoute(card, card.context===EbtCard.CONTEXT_SUTTA);
      },
      async onTab(evt) {
        let msg = "EbtChips.onTab()";
        let { volatile, settings } = this;
        let { routeCard } = volatile;
        if (routeCard) {
          settings.openCard(routeCard);
          nextTick(()=> routeCard.focus());
        }
      },
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
      async onClickChip(card, cards) {
        const msg = `EbtChips.onClickChip() ${card?.id} `;
        const settings = await useSettingsStore();
        const volatile = await useVolatileStore();
        let { ebtChips } = volatile;
        ebtChips && ebtChips.focus();
        volatile.setRoute(card, true);
        if (!card.isOpen) {
          card.isOpen = true;
          let scrolled = await settings.scrollToCard(card);
          if (!scrolled) {
            let { topAnchor, currentElementId } = card;
            if (currentElementId !== topAnchor) {
              await settings.scrollToElementId(topAnchor);
            }
          }
        }
      },
      onClose: (card, settings) => { // DEPRECATED
        let { cards } = settings;
        logger.info(`onClose removing card ${card.id}`);
        nextTick(() => settings.removeCard(card));
      },
      closable: (card, settings) => { // DEPRECATED
        const IS_PHONE = 1; // save space for iPhone
        return !IS_PHONE && settings.cards.length > 1
          ? !card.isOpen && card.context !== EbtCard.CONTEXT_HOME
          : false;
      },
      chipClass(card) {
        let { volatile } = this;
        let chipClass = [];

        card.context === EbtCard.CONTEXT_HOME && chipClass.push('chip-home');
        chipClass.push(card.isOpen ? 'chip-open' : 'chip-closed');
        card.isOpen && card.visible && chipClass.push('card-in-view');
        card === volatile.routeCard && chipClass.push('chip-route-card');
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
<style >
  .chip-container {
    display: flex;
    flex-direction: column;
    min-height: 32px;
    margin-left: 1.0rem;
  }
  .chip-container .v-chip-group {
    padding: 0px !important;
  }
  .chip-container:focus {
    outline: 2px dashed #ce8400;
  }
  .chip-title {
    display: inline-block;
    overflow: hidden;
    max-width: 30px;
    text-overflow: clip;
    padding-right: 0.4em;
  }
  .chip-closed {
    border-bottom: 1px dashed rgb(var(--v-theme-on-surface));
  }
  .chip-open {
    border-bottom: 1px solid rgb(var(--v-theme-on-surface));
    opacity: 0.6;
  }
  .v-chip.v-chip--size-default {
    padding-right: 0px;
  }
  .chip-route-card {
    border-bottom-color: rgb(var(--v-theme-focus));
    border-bottom-width: 3px;
  }
  .card-in-view {
    opacity: 1;
  }
  .chip-route-card .chip-title {
    max-width: 80px;
  }
  .chip-close {
    margin-right: -0.4em;
  }
  .chip-home {
    padding-right: 6pt;
  }
  @media (max-width:400px) {
    .chip-title {
      display: none;
    }
    .chip-route-card .chip-title {
      display: inline;
      max-width: 40px;
    }
    .chip-container {
      margin-left: 0rem;
    }
  }
</style>

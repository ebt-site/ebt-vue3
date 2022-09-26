import { logger } from 'log-instance';
import { v4 as uuidv4 } from 'uuid';

const CONTEXT_SEARCH = "search";
const CONTEXT_SUTTA = "sutta";
const CONTEXT_WIKI = "wiki";
const CONTEXTS = {
  [CONTEXT_SEARCH]: {
    icon: "mdi-magnify",
  },
  [CONTEXT_WIKI]: {
    icon: "mdi-wikipedia",
  },
  [CONTEXT_SUTTA]: {
    icon: "mdi-file-document-outline",
  },
}

export default class EbtCard {
  constructor(opts = {}) {
    let {
      id = uuidv4(),
      context = CONTEXT_WIKI,
      location = "welcome",
      isOpen = true,
    } = opts;

    Object.assign(this, {
      id,
      location,
      context,
      isOpen,
    });
  }

  get icon() {
    return CONTEXTS[this.context]?.icon || "mdi-alert-icon";
  }

  chipTitle($t=((k)=k)) {
    let { location, context } = this;
    if (!!location ) {
      return location;
    }
    if (context === CONTEXT_SEARCH) {
      return $t('ebt.searchHome');
    }
    if (context === CONTEXT_WIKI) {
      return $t('ebt.wikiHome');
    }
    if (context === CONTEXT_SUTTA) {
      return $t('ebt.suttaHome');
    }
    return $t(`context:${context}?`);
  }

}



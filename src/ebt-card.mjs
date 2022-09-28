import { logger } from 'log-instance';
import { v4 as uuidv4 } from 'uuid';

const CONTEXT_SEARCH = "search";
const CONTEXT_SUTTA = "sutta";
const CONTEXT_WIKI = "wiki";
const CONTEXTS = {
  [CONTEXT_SEARCH]: {
    icon: "mdi-cloud-search-outline",
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
      context,
      location=[],
      isOpen = true,
    } = opts;

    if (typeof location === 'string') {
      location = [location];
    }
    if (!(location instanceof Array)) {
      throw new Error('Expected location array');
    }

    Object.assign(this, {
      id,
      location,
      context,
      isOpen,
    });
  }

  static get CONTEXT_SEARCH() { return CONTEXT_SEARCH; }
  static get CONTEXT_WIKI() { return CONTEXT_WIKI; }
  static get CONTEXT_SUTTA() { return CONTEXT_SUTTA; }

  get icon() {
    return CONTEXTS[this.context]?.icon || "mdi-alert-icon";
  }

  chipTitle($t=((k)=>k)) {
    let { location, context } = this;
    if (!!location ) {
      return location.join('/');
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

  matchPath(path='') {
    let rexEnd = new RegExp("/*$");
    path = path.replace(rexEnd, '').toLowerCase();
    let [ empty, context, ...location ] = path.split('/');
    context = context && context.toLowerCase();
    location = location ? location.map(loc => loc && loc.toLowerCase()) : [];
    let cardLocation = this.location instanceof Array 
      ? this.location
      : (this.location == null ? [] : [this.location]);
    if (context !== this.context) {
      if (context == null || this.context == null) {
        //console.log(`matchPath context ${context} != ${this.context}`);
        return false;
      }
      if (context.toLowerCase() !== this.context.toLowerCase()) {
        //console.log(`matchPath context ${context} != ${this.context}`);
        return false;
      }
    }
    if (location.length !== cardLocation.length) {
      //console.log(`matchPath location ${location} != ${cardLocation}`);
      return false;
    }
    let match = location.reduce((a,v,i) => {
      let match = a && (v.toLowerCase() === cardLocation[i].toLowerCase());
      a && !match && console.log(`matchPath location[${i}] ${location[i]} != ${cardLocation[i]}`);
      return a;
    }, true);

    return match;
  }

}



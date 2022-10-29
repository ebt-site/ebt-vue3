import { logger } from 'log-instance';
import { v4 as uuidv4 } from 'uuid';
import { Authors, SuttaRef } from 'scv-esm/main.mjs';

const CONTEXT_HOME = "home";
const CONTEXT_SEARCH = "search";
const CONTEXT_SUTTA = "sutta";
const CONTEXT_WIKI = "wiki";
const CONTEXTS = {
  [CONTEXT_HOME]: {
    icon: "mdi-home",
  },
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
      context,
      location=[],
      isOpen = true,
      data = undefined,
      langTrans, // factory prop
    } = opts;

    if (context == null || context === '') {
      context = CONTEXT_HOME;
    }
    context = context.toLowerCase();

    if (typeof location === 'string') {
      location = [location];
    }
    if (!(location instanceof Array)) {
      throw new Error('Expected location array');
    }
    switch (context) {
      case CONTEXT_SEARCH:
        if (location[0] == null) {
          location[0] = '';
        }
        if (location.length === 1) {
          langTrans && location.push(langTrans);
        }
        break;
      case CONTEXT_SUTTA:
        location[1] == null && (location[1] = langTrans);
        location[2] == null && (location[2] = Authors.langAuthor(langTrans));
        break;
    }

    Object.assign(this, {
      id,
      location,
      context,
      data,
      isOpen,
    });
  }

  static get CONTEXT_HOME() { return CONTEXT_HOME; }
  static get CONTEXT_SEARCH() { return CONTEXT_SEARCH; }
  static get CONTEXT_WIKI() { return CONTEXT_WIKI; }
  static get CONTEXT_SUTTA() { return CONTEXT_SUTTA; }

  static pathToCard(args) {
    let {path='/', cards=[], addCard, defaultLang} = args;
    let [ tbd, context, ...location ] = path.split('/');
    location = location.map(loc => decodeURIComponent(loc));
    let card = cards.find(card => card.matchPath({path, defaultLang}));
    if (card == null) {
      if (!addCard) {
        throw new Error("addCard is required");
      }
      card = addCard({context, location});
      card && logger.info(`pathToCard ${args} (NEW)`, {card, context, location});
    } else {
      logger.info(`pathToCard ${args} (EXISTING))`, card);
    } 
    if (card && card.isOpen) {
      if (cards.length > 1 && card.context !== CONTEXT_HOME) {
        card.isOpen = true;
      }
    }

    return card;
  }

  get icon() {
    return CONTEXTS[this.context]?.icon || "mdi-alert-icon";
  }

  get topAnchor() {
    return `${this.id}-top`;
  }

  get titleAnchor() {
    return `${this.id}`;
  }

  get currentElementId() {
    let { context, location } = this;
    switch (context) {
      case CONTEXT_SUTTA:
        return location[0].includes(':')
          ? this.routeHash()
          : this.titleAnchor;
      default:
        return this.titleAnchor;
    }
  }

  routeHash(dstPath) {
    let { context, location } = this;
    switch (context) {
      case CONTEXT_SUTTA: 
        if (dstPath) {
          let [ ignored, ctx, suttaSeg, lang, author ] =  dstPath.split('/');
          location[0] = suttaSeg;
        }
        return location.reduce((a,v) => {
          return `${a}/${v}`;
        }, `#/${context}`);
      default:
        return location.reduce((a,v) => {
          return `${a}/${encodeUriComponent(v)}`;
        }, `#/${context}`);
    }
  }

  chipTitle($t=((k)=>k)) {
    let { location, context } = this;
    if (location.length) {
      if (context === CONTEXT_SEARCH) {
        return location[0];
      }
      return location.join('/');
    }
    return $t(`ebt.no-location-${context}`);
  }

  matchPathSutta({opts, context, location, cardLocation, }) {
    let { path, defaultLang } = opts;
    let dbg = 0;
    let loc = location.join('/');
    let cardLoc = cardLocation.join('/');
    if (loc === '') {
      let result = cardLoc === loc;
      dbg && console.log(`matchPath(${path}) => ${result}`, {cardLoc, loc});
      return result;
    }
    if (cardLoc === '') {
      dbg && console.log(`matchPath(${path}) => false`, {cardLoc, loc});
      return false;
    }
    let pathRef = SuttaRef.create(loc, defaultLang);
    let cardRef = SuttaRef.create(cardLoc, defaultLang);
    if (pathRef.suid !== cardRef.suid) {
      dbg && console.log(`matchPath(${path}) => false`, pathRef.suid, cardRef.suid);
      return false;
    }
    if (pathRef.lang && pathRef.lang !== cardRef.lang) {
      dbg && console.log(`matchPath(${path}, ${defaultLang}) => false`, 
        pathRef.lang, cardRef.lang);
      return false;
    }
    if (pathRef.author && pathRef.author !== cardRef.author) {
      dbg && console.log(`matchPath(${path}) => false`, pathRef.author, cardRef.author);
      return false;
    }
    dbg && console.log(`matchPath(${path})`, pathRef.toString(), '~=', cardRef.toString());
    return true;
  }

  matchPath(strOrObj) {
    let opts = typeof strOrObj === 'string'
      ? { path: strOrObj }
      : strOrObj;
    let { path } = opts;
    path = path.toLowerCase();
    let [ tbd, context="", ...location ] = path.split('/');
    while (location.length && location[location.length-1] === '') {
      location.pop();
    }
    context = context && context.toLowerCase() || CONTEXT_HOME;
    location = location 
      ? location.map(loc => loc && decodeURIComponent(loc.toLowerCase())) 
      : [];

    let dbg = 0;
    let cardLocation = this.location instanceof Array 
      ? this.location
      : (this.location == null ? [] : [this.location]);
    if (tbd !== '') {
      dbg && console.log(`matchPath(${path}) expected initial "/"`, {tbd});
      return false;
    }
    if (context !== this.context) {
      dbg && console.log(`matchPath(${path}) context ${context} != ${this.context}`);
      return false;
    }
    if (context === CONTEXT_SUTTA) {
      return this.matchPathSutta({opts, context, location, cardLocation});
    }
    if (location.length !== cardLocation.length) {
      if (context === CONTEXT_SEARCH) {
        if (location.length === 0) {
          location.push('');
        }
        if (cardLocation[0] === location[0] && location.length<2) {
          return true; // empty search path without langTrans
        }
      }
      dbg && console.log([
        `matchPath(${path})`,
        `location:${JSON.stringify(location)}`,
        `!=`,
        `cardLocation:${JSON.stringify(cardLocation)}`].join(' '));
      return false;
    }
    let match = location.reduce((a,v,i) => {
      let vDecoded = decodeURIComponent(v.toLowerCase());
      let match = a && (vDecoded === cardLocation[i].toLowerCase());
      if (dbg && !match) {
        console.log(`matchPath(${path}) location[${i}]`,
          `${location[i]} != ${cardLocation[i]}`);
      }
      return match;
    }, true);

    dbg && console.log(`matchPath(${path}) => ${match}`, {context, location});
    return match;
  }

}



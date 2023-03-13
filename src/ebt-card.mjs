import { logger } from 'log-instance';
import { v4 as uuidv4 } from 'uuid';
import { Authors, SuttaRef } from 'scv-esm/main.mjs';

const CONTEXT_HOME = "home";
const CONTEXT_SEARCH = "search";
const CONTEXT_SUTTA = "sutta";
const CONTEXT_WIKI = "wiki";
const CONTEXT_DEBUG = "debug";
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
  [CONTEXT_DEBUG]: {
    icon: "mdi-tools",
  },
}

export default class EbtCard {
  constructor(opts = {}) {
    let msg = 'EbtCard.ctor() ';
    let {
      id = uuidv4().split('-').pop(),
      context,
      location=[],
      isOpen = true,
      data = undefined,
      langTrans, // factory prop
    } = opts;

    //console.trace(`DBG0201 ${msg} ${context} ${id} ${location[0]}`);
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
      case CONTEXT_DEBUG: 
        if (location[0] == null) {
          location[0] = 'Debug';
        }
        break;
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

    Object.assign(this, {// primary properties
      id,
      location,
      context,
      data,
      isOpen,
    });

    // secondary properties
  }

  static get CONTEXT_HOME() { return CONTEXT_HOME; }
  static get CONTEXT_SEARCH() { return CONTEXT_SEARCH; }
  static get CONTEXT_WIKI() { return CONTEXT_WIKI; }
  static get CONTEXT_SUTTA() { return CONTEXT_SUTTA; }
  static get CONTEXT_DEBUG() { return CONTEXT_DEBUG; }

  static routeSuttaRef(route) {
    let hashParts = route.split("/");
    if (hashParts[0] === '#') {
      hashParts.shift();
    }
    let [ context, sutta_uid, lang, author ] = hashParts;
    return context === EbtCard.CONTEXT_SUTTA
      ? SuttaRef.create({sutta_uid, lang, author})
      : null;
  }

  static pathToCard(args) {
    let msg = 'EbtCard.pathToCard() ';
    let {path='/', cards=[], addCard, defaultLang} = args;
    let [ tbd, context, ...location ] = path.split('/');
    location = location.map(loc => decodeURIComponent(loc));
    let card = cards.find(card => card.matchPath({path, defaultLang}));
    if (card == null) {
      if (!addCard) {
        throw new Error(msg+"addCard is required");
      }
      card = addCard({context, location});
      card && logger.info(msg+`${args} (NEW)`, {card, context, location});
    } else {
      logger.debug(msg+`(EXISTING))`, {args,card});
    } 

    return card;
  }

  get tab1Id() {
    return `${this.id}-tab1`;
  }

  get autofocusId() {
    return `${this.id}-autofocus`;
  }

  get icon() {
    return CONTEXTS[this.context]?.icon || "mdi-alert-icon";
  }

  get topAnchor() {
    return `${this.id}-top`;
  }

  get titleAnchor() {
    return `${this.id}-title`;
  }

  get currentElementId() {
    let { context, location } = this;
    switch (context) {
      case CONTEXT_SUTTA:
        return location.length>0 && location[0].includes(':')
          ? this.routeHash()
          : this.titleAnchor;
      default:
        return this.titleAnchor;
    }
  }

  focus() {
    const msg = 'EbtCard.focus() ';
    let elt = document.getElementById(this.autofocusId);
    if (elt) {
      elt.focus();
      logger.debug(msg, this.autofocusId);
    } else if ((elt = document.getElementById(this.tab1Id))) {
      elt.focus();
      logger.debug(msg, this.tab1Id);
    } else {
      logger.warn(msg, 'element not found', {
        autofocusId: this.autofocusId, 
        tab1Id: this.tab1Id,
      });
    }
    return elt;
  }

  routeHash(dstPath) {
    let { context, location } = this;
    switch (context) {
      case CONTEXT_SEARCH:
        return location.reduce((a,v) => {
          return `${a}/${encodeURIComponent(v)}`;
        }, `#/${context}`);
        
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
          return `${a}/${encodeURIComponent(v)}`;
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
      dbg && console.log(`[1]matchPathSutta(${path}) => ${result}`, {cardLoc, loc});
      return result;
    }
    if (cardLoc === '') {
      dbg && console.log(`[2]match(${path}) => false`, {cardLoc, loc});
      return false;
    }
    let msStart = Date.now();
    let pathRef = SuttaRef.create(loc, defaultLang);
    if (pathRef == null) {
      dbg && console.log(`[2.5]match(${path}) => false`, {loc});
      return false;
    }
    let cardRef = SuttaRef.create(cardLoc, defaultLang);
    if (pathRef.sutta_uid !== cardRef.sutta_uid) {
      dbg && console.log(`[3]match(${path}) => false`, pathRef.suid, cardRef.suid);
      return false;
    }
    if (pathRef.lang && pathRef.lang !== cardRef.lang) {
      dbg && console.log(`[4]match(${path}, ${defaultLang}) => false`, 
        pathRef.lang, cardRef.lang);
      return false;
    }
    if (pathRef.author && pathRef.author !== cardRef.author) {
      dbg && console.log(`[5]match(${path}) => false`, 
        pathRef.author, cardRef.author);
      return false;
    }

    dbg && console.log(`[6]match(${path})`, 
      pathRef.toString(), '~=', cardRef.toString());
    return true;
  }

  matchPath(strOrObj) {
    let opts = typeof strOrObj === 'string'
      ? { path: strOrObj }
      : strOrObj;
    let { path } = opts;
    path = path.toLowerCase().replace(/^#/, '');
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

  nextLocation({segments, delta=1}) {
    let { context } = this;
    let [...location] = this.location;

    if (context === CONTEXT_SUTTA) {
      let [ scid, lang, author ] = location;
      let iSeg = segments.findIndex(seg=>seg.scid === scid);
      if (iSeg < 0) {
        iSeg = 0;
      }
      let iSegNext = iSeg + delta;
      if (iSeg<0 || iSegNext<0 || segments.length<=iSegNext) {
        logger.debug("next segment out of bounds", {iSeg, iSegNext, delta});
        return null;
      }
      location[0] = segments[iSegNext].scid;
      return {
        location,
        iSegment: iSegNext,
      };
    }
  }

  incrementLocation({segments, delta=1}) {
    let { context } = this;
    let result = this.nextLocation({segments, delta});

    if (result) {
      let { location:nextLocation, iSegment } = result;

      if (this.location.join('/') !== nextLocation.join('/')) {
        this.location = nextLocation;
      }
    }

    return result;
  }

  setLocation({segments, delta=0}) {
    const msg = 'EbtCard.setLocation() ';
    let { context } = this;
    let [...newLocation] = this.location;

    let result = null;
    if (context === CONTEXT_SUTTA) {
      if (segments.length <= 0) {
        logger.info(msg, "no segments");
        return result;
      }
      let iSegNext = delta >= 0 ? delta : segments.length+delta;
      newLocation[0] = segments[iSegNext].scid;

      if (this.location.join('/') !== newLocation.join('/')) {
        this.location = newLocation;
        result = {
          location: newLocation,
          iSegment: iSegNext,
        };
      }
    }
    return result;
  }

}



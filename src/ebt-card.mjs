import { logger } from 'log-instance';
import { v4 as uuidv4 } from 'uuid';
import { Authors, SuttaRef } from 'scv-esm/main.mjs';

const CONTEXT_WIKI = "wiki";
const CONTEXT_SEARCH = "search";
const CONTEXT_SUTTA = "sutta";
const CONTEXT_DEBUG = "debug";
const CONTEXTS = {
  [CONTEXT_WIKI]: {
    icon: "mdi-wikipedia",
  },
  [CONTEXT_SEARCH]: {
    icon: "mdi-magnify",
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
      id,
      context,
      location=[],
      isOpen = true,
      data = undefined,
      langTrans, // factory prop
    } = opts;

    if (context == null || context === '') {
      context = CONTEXT_WIKI;
    }
    context = context.toLowerCase();
    if (id == null) {
      id = context===CONTEXT_WIKI 
        ? 'home-card-id' 
        : uuidv4().split('-').pop();
    }

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

    logger.info(msg, `${context} ${id} ${location[0]}`);
  }

  static get CONTEXT_WIKI() { return CONTEXT_WIKI; }
  static get CONTEXT_WIKI() { return CONTEXT_WIKI; }
  static get CONTEXT_SEARCH() { return CONTEXT_SEARCH; }
  static get CONTEXT_SUTTA() { return CONTEXT_SUTTA; }
  static get CONTEXT_DEBUG() { return CONTEXT_DEBUG; }

  static routeSuttaRef(route, langTrans='en') {
    const msg = 'EbtCard.routeSuttaRef() ';
    let routeParts = route.split('#/sutta');
    //console.log(msg, {route, langTrans, routeParts});
    if (routeParts.length !== 2) {
      return null;
    }
    let refStr = routeParts[1].slice(1);
    return SuttaRef.create(refStr, langTrans)
  }

  static pathToCard(args) {
    let msg = 'EbtCard.pathToCard() ';
    let {path='/', cards=[], addCard, defaultLang} = args;
    path = path.replace(/^.*\/#/, ''); // ignore non-hash part of path
    let [ ignored, context, ...location ] = path.split('/');
    location = location.map(loc => decodeURIComponent(loc));
    let card = cards.find(card => card.matchPath({path, defaultLang}));
    if (card == null) {
      if (!addCard) {
        throw new Error(msg+"addCard is required");
      }
      card = addCard({context, location});
      //console.log(msg, {card, path});
      card && logger.info(msg+`${args} (NEW)`, {card, context, location});
    } else {
      logger.debug(msg+`(EXISTING))`, {args,card});
    } 

    if (card && card.context === CONTEXT_WIKI) {
      let newLocation = path.split('/').slice(2);
      card.location = newLocation;
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
          ? this.segmentElementId()
          : this.titleAnchor;
      default:
        return this.titleAnchor;
    }
  }

  focus() {
    const msg = 'EbtCard.focus() ';
    let { autofocusId, tab1Id, volatile } = this;
    let elt = document.getElementById(autofocusId);
    if (elt) {
      elt.focus();
      logger.debug(msg, autofocusId);
    } else if ((elt = document.getElementById(tab1Id))) {
      elt.focus();
      logger.debug(msg, tab1Id);
    } else {
      logger.warn(msg, 'element not found', { autofocusId, tab1Id, volatile});
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
        let [ suttaSeg, lang, author ] = location;
        // NOTE: See segmentElementId()
        return `#/sutta/${suttaSeg}/${lang}/${author}`;
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
    const msg = 'EbtCard.matchPath() ';
    let opts = typeof strOrObj === 'string'
      ? { path: strOrObj }
      : strOrObj;
    let { path } = opts;
    let dbg = 0;
    path = path.toLowerCase().replace(/^#/, '');
    let [ blank, context="", ...location ] = path.split('/');
    if (blank !== '') {
      dbg && console.log(msg, `(${path}) expected initial "/"`, {blank});
      return false;
    }
    while (location.length && location[location.length-1] === '') {
      location.pop();
    }
    context = context && context.toLowerCase() || CONTEXT_WIKI;
    if (context === this.context && context===CONTEXT_WIKI) {
      // all wiki locations are owned by home card singleton
      dbg && console.log(msg, 'CONTEXT_WIKI', strOrObj, this);
      return true;
    }
    location = location 
      ? location.map(loc => loc && decodeURIComponent(loc.toLowerCase())) 
      : [];

    let cardLocation = this.location instanceof Array 
      ? this.location
      : (this.location == null ? [] : [this.location]);
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

  segGroup(scid) {
    let segnum = scid.split(':')[1];
    return segnum.split('.')[0];
  }

  groupStartIndex({segments=[], iSegCur=0}) {
    const msg = 'EbtCard.groupStartIndex() ';
    let { context, } = this;

    if (context !== CONTEXT_SUTTA || segments.length <= 0) {
      return 0;
    }

    let scid = segments[iSegCur].scid;
    let curGroup = this.segGroup(scid);
    iSegCur = iSegCur < 0 ? 0 : iSegCur;
    let iSegPrev = iSegCur;
    let iSegNext = Math.min(segments.length-1, Math.max(0, iSegPrev-1));
    let nextScid = segments[iSegNext].scid;
    let nextGroup = this.segGroup(nextScid);
    while (iSegPrev !== iSegNext && curGroup === nextGroup) {
      iSegPrev = iSegNext;
      iSegNext = Math.min(segments.length-1, Math.max(0, iSegPrev-1));
      nextScid = segments[iSegNext].scid;
      nextGroup = this.segGroup(nextScid);
    }
    return iSegPrev;
  }

  incrementGroup({segments=[], delta=1}) {
    const msg = 'EbtCard.incrementGroup() ';
    let result = null;
    let { context } = this;
    let [...location] = this.location;

    if (context !== CONTEXT_SUTTA || segments.length <= 0) {
      return result;
    }

    let scid = this.location[0];
    let curGroup = this.segGroup(scid);
    let iSegCur = segments.findIndex(seg=>seg.scid === scid);
    iSegCur = iSegCur < 0 ? 0 : iSegCur;
    let iSegPrev = iSegCur;
    let iSegNext = Math.min(segments.length-1, Math.max(0, iSegPrev+delta));
    let iSegment = iSegNext;

    if (delta < 0) {
      iSegment = this.groupStartIndex({segments, iSegCur});
      if (iSegment === iSegCur) {
        iSegment = this.groupStartIndex({segments, iSegCur: iSegNext});
      }
      if (iSegment !== iSegCur) {
        location[0] = segments[iSegment].scid;
        result = { location, iSegment }
      }
    }

    while (result == null && iSegPrev !== iSegment) {
      let nextScid = segments[iSegment].scid;
      let nextGroup = this.segGroup(nextScid);
      if (nextGroup !== curGroup) {
        location[0] = nextScid;
        result = { location, iSegment };
        break;
      }
      iSegPrev = iSegment;
      iSegment = Math.min(segments.length-1, Math.max(0, iSegPrev+delta));
    }

    if (result) {
      this.location = result.location;
    }

    return result;
  }

  segmentElementId(scid) {
    let { id, context, location } = this;
    if (context !== CONTEXT_SUTTA) {
      scid = scid || 'no-segment';
      return `${id}:${scid}`;
    }

    scid = scid || location[0];

    let [ ignore, lang, author ] = location;

    // NOTE: routeHash() and segmentElementId() must differ
    // to prevent the browser from auto-navigating
    // to segmentElementId's when the route changes
    return `suttaref-${scid}/${lang}/${author}`;
  }

}



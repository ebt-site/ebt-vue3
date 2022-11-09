import { logger } from 'log-instance';
import { SuttaRef, SuttaCentralId } from 'scv-esm/main.mjs';
import * as Idb from "idb-keyval";

const OPTIONAL_PROPS = ['saved', 'refAuthor', 'refLang'];

export default class IdbSutta {
  static #privateCtor;

  constructor(opts = {}) {
    if (!IdbSutta.#privateCtor) {
      throw new Error("use IdbSutta.create()");
    }

    Object.assign(this, opts);
  }
  
  static #copyOptional(src,dst) {
    OPTIONAL_PROPS.forEach(prop=>{
      if (src[prop] != null) {
        dst[prop] = src[prop];
      }
    });
  }


  static create(opts = {}) {
    let { 
      sutta_uid, 
      lang, 
      author = opts.author_uid,
      segments,
    } = opts;

    try {
      IdbSutta.#privateCtor = true;

      if (segments) { // opts is IdbSutta-like
        let idbSutta = {sutta_uid, lang, author, segments};
        IdbSutta.#copyOptional(opts, idbSutta);
        return new IdbSutta(idbSutta);
      } 

      // opts is MlDoc
      let { segMap } = opts;
      if (segMap == null) {
        throw new Error(`IdbSutta.create() required: segMap or segments`);
      }
      let idbSutta = new IdbSutta({sutta_uid, lang, author, segments:[]});
      let mlDoc = {sutta_uid, lang, author_uid: author, segMap};
      idbSutta.merge({mlDoc});
      return idbSutta;
    } finally {
      IdbSutta.#privateCtor = false;
    }
  }

  static idbKey(suttaRef) {
    let sref = SuttaRef.create(suttaRef);
    if (sref == null) {
      throw new Error(`IdbSutta.idbKey() invalid suttaRef:${suttaRef}`);
    }
    let { sutta_uid, lang, author} = sref;
    return `/sutta/${sutta_uid}/${lang}/${author}`;
  }

  get idbKey() {
    let { sutta_uid, lang, author } = this;
    return IdbSutta.idbKey({ sutta_uid, lang, author });
  }

  merge(opts={}) {
    let { mlDoc, refLang } = opts;
    if (mlDoc == null) {
      throw new Error(`IdbSutta.merge({mlDoc?}) mlDoc is required`);
    }
    let { segments:dstSegs } = this;
    let dstSegMap = dstSegs.reduce((a,seg) => {
      a[seg.scid] = seg;
      return a;
    }, {});
    let { lang, author_uid, segMap:srcSegMap } = mlDoc;
    if (srcSegMap == null) {
      throw new Error(`IdbSutta.merge({mlDoc.segMap?}) invalid mlDoc`);
    }
    if (refLang) {
      this.refAuthor = author_uid;
      this.refLang = refLang;
    } else {
      this.author = author_uid;
      this.lang = lang;
    }
    Object.keys(srcSegMap).forEach(scid=>{
      let srcSeg = srcSegMap[scid];
      let dstSeg = dstSegMap[scid];
      if (!dstSeg) {
        dstSeg = {scid:srcSeg.scid};
        dstSegMap[scid] = dstSeg;
      }
      if (refLang) {
        dstSeg.ref = srcSeg[refLang];
      } else {
        Object.assign(dstSeg, srcSeg);
      }
    });
    this.segments = Object.keys(dstSegMap)
      .sort(SuttaCentralId.compareLow)
      .reduce((a,v,i) => {
        a[i] = dstSegMap[v];
        return a;
      }, []);
  }

}

import { logger } from 'log-instance';
import { SuttaCentralId } from 'scv-esm/main.mjs';

export default class IdbSutta {
  static #privateCtor;

  constructor(opts = {}) {
    if (!IdbSutta.#privateCtor) {
      throw new Error("use IdbSutta.create()");
    }

    Object.assign(this, opts);
  }

  static create(opts = {}) {
    let { 
      sutta_uid, 
      lang, 
      author = opts.author_uid,
      segments,
      segMap,
    } = opts;

    try {
      IdbSutta.#privateCtor = true;
      if (segments) {
        return new IdbSutta({sutta_uid, lang, author, segments});
      } else if (segMap) {
        let sutta = new IdbSutta({sutta_uid, lang, author, segments:[]});
        let mlDoc = {sutta_uid, lang, author_uid: author, segMap};
        sutta.merge({mlDoc});
        return sutta;
      } else {
        throw new Error(`IdbSutta.create() required: segMap or segments`);
      }
    } finally {
      IdbSutta.#privateCtor = false;
    }
  }

  get idbKey() {
    let { sutta_uid, lang, author } = this;
    return `/sutta/${sutta_uid}/${lang}/${author}`;
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
    let { segMap:srcSegMap } = mlDoc;
    if (srcSegMap == null) {
      throw new Error(`IdbSutta.merge({mlDoc.segMap?}) invalid mlDoc`);
    }
    Object.keys(srcSegMap).forEach(scid=>{
      let srcSeg = srcSegMap[scid];
      let dstSeg = dstSegMap[scid];
      if (dstSeg) {
        if (refLang) {
          dstSeg.ref = srcSeg[refLang];
        } else {
          Object.assign(dstSeg, srcSeg);
        }
      } else {
        dstSeg = refLang
          ? {scid: srcSeg.scid, ref: srcSeg[refLang]}
          : Object.assign({}, srcSeg);
        dstSegMap[scid] = dstSeg;
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

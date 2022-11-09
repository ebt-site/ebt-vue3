import { logger } from "log-instance";
import should from "should";
import "fake-indexeddb/auto";
import { default as IdbSutta } from "../src/idb-sutta.mjs";
import * as Idb from "idb-keyval";

logger.logLevel = 'warn';

const TESTSEG1_0 = {
  scid: "testsuid:1.0",
  testlang: "testsuid:1.0-text",
};
const TESTSEG1_1 = {
  scid: "testsuid:1.1",
  testlang: "testsuid:1.1-text",
};
const TESTSEG1_2 = {
  scid: "testsuid:1.2",
  testlang: "testsuid:1.2-text",
};
const TESTSEG1_2A = {
  scid: "testsuid:1.2",
  testlang: "testsuid:1.2-textA",
};
const TESTSEG1_3 = {
  scid: "testsuid:1.3",
  testlang: "testsuid:1.3-text",
};
const TESTMAP = {
  [TESTSEG1_0.scid]: TESTSEG1_0,
  [TESTSEG1_1.scid]: TESTSEG1_1,
  [TESTSEG1_2.scid]: TESTSEG1_2,
};
const TESTSEGS = [
  TESTSEG1_0,
  TESTSEG1_1,
  TESTSEG1_2,
];
const TESTMLDOC = {
  sutta_uid: 'testsuid',
  lang: 'testlang',
  author_uid: 'test-author',
  segMap: TESTMAP,
};

(typeof describe === 'function') && describe("idb-sutta.mjs", function () {
  it("private ctor", async () => {
    let sutta_uid = "testsuid";
    let lang = 'testlang';
    let author = 'test-author';
    let segMap = TESTMAP;
    let mlDoc = { sutta_uid, lang, author_uid:author, segMap, }
    let eCaught;
    try { new IdbSutta(); } catch(e) { eCaught = e; }
    should(eCaught?.message).match(/use idbSutta.create/i);
    eCaught = undefined;
    try { new IdbSutta(mlDoc); } catch(e) { eCaught = e; }
    should(eCaught?.message).match(/use idbSutta.create/i);
  });
  it("create(mlDoc)", ()=>{
    let sutta_uid = "testsuid";
    let lang = 'testlang';
    let author = 'test-author';
    let segMap = TESTMAP;
    let mlDoc = { sutta_uid, lang, author_uid:author, segMap, }
    let sutta = IdbSutta.create(mlDoc);
    should(sutta).properties({
      sutta_uid,
      lang, 
      author,
    });
    should.deepEqual(sutta.segments, TESTSEGS);
  });
  it("create(mlDoc) segment order", ()=>{
    let sutta_uid = "testsuid";
    let lang = 'testlang';
    let author = 'test-author';
    let segMap = {};
    // This test checks that segments are ordered correctly 
    // even if segMap is constructed out of order
    for (let i = TESTSEGS.length; i--;) {
      segMap[TESTSEGS[i].scid] = TESTSEGS[i];
    }
    let mlDoc = { sutta_uid, lang, author_uid:author, segMap, }
    let sutta = IdbSutta.create(mlDoc);
    should(sutta).properties({
      sutta_uid,
      lang, 
      author,
    });
    should.deepEqual(sutta.segments, TESTSEGS);
  });
  it("create(mlDocProxy)", ()=>{
    let sutta_uid = "testsuid";
    let lang = 'testlang';
    let author = 'test-author';
    let segMap = TESTMAP;
    let mlDoc = { sutta_uid, lang, author_uid:author, segMap, }
    let sutta = IdbSutta.create(mlDoc);
    should(sutta).properties({ sutta_uid, lang, author, });
    should.deepEqual(sutta.segments, TESTSEGS);
  });
  it("create(idbSutta)", ()=>{
    let sutta_uid = "testsuid";
    let lang = 'testlang';
    let author = 'test-author';
    let segMap = TESTMAP;
    let mlDoc = { sutta_uid, lang, author_uid:author, segMap, }
    let sutta = IdbSutta.create(mlDoc);
    let sutta2 = IdbSutta.create(sutta);
    let sutta3 = IdbSutta.create(new Proxy(sutta, {}));
    should.deepEqual(sutta2, sutta);
    should.deepEqual(sutta3, sutta);
  });
  it("serialize", ()=>{
    let sutta_uid = "testsuid";
    let lang = 'testlang';
    let author = 'test-author';
    let segments = TESTMAP;
    let sutta = IdbSutta.create({sutta_uid, lang, author, segments});
    let json = JSON.stringify(sutta);
    let sutta2 = IdbSutta.create(JSON.parse(json));
    should.deepEqual(sutta2, sutta);
  });
  it("idbKey", ()=>{
    let sutta = IdbSutta.create({
      sutta_uid: 'thig1.1',
      lang: 'en',
      author: 'soma',
      segments: [],
    });
    should(sutta.idbKey).equal('/sutta/thig1.1/en/soma');
  });
  it("merge mlDoc lang", ()=>{
    let sutta = IdbSutta.create(TESTMLDOC);
    let dstSutta = IdbSutta.create(TESTMLDOC);
    let sutta_uid = 'testsuid';
    let lang = 'testlang';
    let author_uid = 'test-author';
    let updatedSeg1_1 = {
      scid: TESTSEG1_1.scid,
      [lang]: "test-update",
    }
    let srcSegMap = {
      [TESTSEG1_0.scid]: new Proxy(TESTSEG1_0, {}),
      [TESTSEG1_1.scid]: new Proxy(updatedSeg1_1, {}),
      [TESTSEG1_3.scid]: TESTSEG1_3,
    }
    let mlDoc = { sutta_uid, lang, author_uid, segMap:srcSegMap, }

    // Merge updates and adds but does not delete
    dstSutta.merge({mlDoc});
    should(dstSutta).properties({sutta_uid, lang, author: author_uid});
    should.deepEqual(dstSutta.segments, [
      TESTSEG1_0,    // existing
      updatedSeg1_1, // updated
      TESTSEG1_2,    // existing
      TESTSEG1_3,    // new segment
    ]);
  });
  it("TESTTESTmerge mlDoc refLang", ()=>{
    let sutta = IdbSutta.create(TESTMLDOC);
    let dstSutta = IdbSutta.create(TESTMLDOC);
    let sutta_uid = 'testsuid';
    let lang = 'ref-lang';
    let refLang = TESTMLDOC.lang;
    let author_uid = 'ref-author';
    let updatedSeg1_1 = {
      scid: TESTSEG1_1.scid,
      [lang]: "test-update",
    }
    let srcSegMap = {
      [TESTSEG1_0.scid]: new Proxy(TESTSEG1_0, {}),
      [TESTSEG1_1.scid]: new Proxy(updatedSeg1_1, {}),
      [TESTSEG1_3.scid]: TESTSEG1_3,
    }
    let mlDoc = { sutta_uid, lang, author_uid, segMap:srcSegMap, }

    // Merge with refLang creates a "ref" property with value
    // obtained from sourceSegment[refLang]
    dstSutta.merge({mlDoc, refLang});
    should(dstSutta).properties({
      sutta_uid, 
      lang: TESTMLDOC.lang,
      author: TESTMLDOC.author_uid,
      refAuthor: author_uid,
      refLang,
    });
    should.deepEqual(dstSutta.segments[0], 
      Object.assign({}, TESTSEG1_0, {ref:TESTSEG1_0.testlang}) // old seg
    ); 
    should.deepEqual(dstSutta.segments[1], 
      Object.assign({}, TESTSEG1_1, {ref:updatedSeg1_1.testlang}), // old seg
    );
    should.deepEqual(dstSutta.segments[2], 
      TESTSEG1_2,   // old seg but no ref content
    );
    should.deepEqual(dstSutta.segments[3], 
      Object.assign({scid:TESTSEG1_3.scid, ref:TESTSEG1_3.testlang}), // new seg
    );
    should(dstSutta.segments.length).equal(4);
  });
});

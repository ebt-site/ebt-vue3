import should from "should";
import { setActivePinia, createPinia } from 'pinia';
import { SuttaRef } from 'scv-esm/main.mjs';
import { logger } from "log-instance";
import fetch from "node-fetch";
logger.logLevel = 'warn';

import { useSettingsStore } from '../src/stores/settings.mjs';
import { useSuttasStore } from '../src/stores/suttas.mjs';
import { default as IdbSutta } from "../src/idb-sutta.mjs";
import * as Idb from "idb-keyval";

const THIG1_1_SOMA = SuttaRef.create('thig1.1/en/soma');

// mock global environment
import "fake-indexeddb/auto";
global.window = {}
import 'mock-local-storage'

const MSSEC = 1000;
const MSDAY = 24*3600*MSSEC;

(typeof describe === 'function') && describe("suttas-store.mjs", function () {
  beforeEach(() => {
    window.localStorage = global.localStorage
    setActivePinia(createPinia());
    global.fetch = global.fetch || fetch;
  });
  it("TESTTESTdefault state", ()=>{
    let suttas = useSuttasStore();
    should(suttas).properties({
      nFetch: 0,
      nGet: 0,
      nSet: 0,
      maxAge: MSDAY,
    });
  });
  it("suttaUrl", async () => {
    let settings = useSettingsStore();
    should(settings.langTrans).equal('en');
    let langTrans = 'zz';
    settings.langTrans = langTrans;
    should(settings.langTrans).equal(langTrans);
    let suttas = useSuttasStore();
    let server = 'https://s1.sc-voice.net/scv';
    let suttaRef = SuttaRef.create(THIG1_1_SOMA);
    should(suttas.suttaUrl(suttaRef)).equal([
      server,
      'search',
      'thig1.1%2Fen%2Fsoma',
      'en', // not zz!
    ].join('/'));
  });
  it("TESTTESTloadIdbSutta", async () => {
    //logger.logLevel = 'info';
    let suttas = useSuttasStore();
    let { nFetch, nGet, nSet } = suttas;
    let suttaRef = SuttaRef.create(THIG1_1_SOMA);

    // Load sutta from cloud
    let idbSutta = await suttas.loadIdbSutta(suttaRef);
    should(idbSutta).properties({
      sutta_uid: 'thig1.1',
      lang: 'en',
      author: 'soma',
    });
    should(suttas.nGet).equal(nGet+1);
    should(suttas.nSet).equal(nSet+1);
    should(suttas.nFetch).equal(nFetch+1);
    let [seg0] = idbSutta.segments;
    should(seg0.en).match(/Elder Bhikkhunīs/);
    should(seg0.pli).match(/Therīgāthā 1.1/);
    let saved = idbSutta.saved;
    should(typeof saved).equal('number');

    // Load cached sutta
    let idbSutta2 = await suttas.loadIdbSutta(suttaRef);
    should.deepEqual(idbSutta2, idbSutta);
    should(suttas.nGet).equal(nGet+2);
    should(suttas.nSet).equal(nSet+1);
    should(suttas.nFetch).equal(nFetch+1);

    // Don't refresh almost stale data
    let freshSaved = Date.now() - MSDAY + MSSEC;
    Idb.set(idbSutta.idbKey, Object.assign({}, idbSutta, {saved:freshSaved}));
    let idbSutta3 = await suttas.loadIdbSutta(suttaRef);
    should(idbSutta3.saved).equal(freshSaved);
    should(suttas.nGet).equal(nGet+3);
    should(suttas.nSet).equal(nSet+1);
    should(suttas.nFetch).equal(nFetch+1);

    // Re-fetch stale sutta
    let staleSaved = Date.now() - MSDAY - 1;
    Idb.set(idbSutta.idbKey, Object.assign({}, idbSutta, {saved:staleSaved}));
    let idbSutta4 = await suttas.loadIdbSutta(suttaRef);
    let age = Date.now() - idbSutta4.saved;
    should(age).below(MSSEC);
  });
  it("TESTTESTsaveIdbSutta()", async () => {
    let suttas = useSuttasStore();
    let { nFetch, nGet, nSet } = suttas;
    let author = 'test-author';
    let lang = 'test-lang';
    let sutta_uid = "thig1.1";
    let segments = [{
      "testsuid:0.1": "TEST-SEGMENT",
    }];
    let idbSutta = IdbSutta.create({ author, lang, sutta_uid, segments, });

    let idbSuttaSaved = await suttas.saveIdbSutta(idbSutta);
    should(idbSuttaSaved).properties(idbSutta);
    let now = Date.now();
    should(now - idbSuttaSaved.saved).above(-1).below(MSSEC);
    should(suttas.nGet).equal(nGet);
    should(suttas.nSet).equal(nSet+1);

    let idbSuttaLoaded = await suttas.loadIdbSutta({author, lang, sutta_uid});
    should.deepEqual(idbSuttaLoaded, idbSuttaSaved);
    should(suttas.nGet).equal(nGet+1);
    should(suttas.nSet).equal(nSet+1);
  });
})

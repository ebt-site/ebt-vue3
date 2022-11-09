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
  it("default state", ()=>{
    let suttas = useSuttasStore();
    should(suttas.maxAge).equal(MSDAY);
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
  it("loadIdbSutta", async () => {
    //logger.logLevel = 'info';
    let suttas = useSuttasStore();
    let suttaRef = SuttaRef.create(THIG1_1_SOMA);

    // Load sutta from cloud
    let idbSutta = await suttas.loadIdbSutta(suttaRef);
    should(idbSutta).properties({
      sutta_uid: 'thig1.1',
      lang: 'en',
      author: 'soma',
    });
    let [seg0] = idbSutta.segments;
    should(seg0.en).match(/Elder Bhikkhunīs/);
    should(seg0.pli).match(/Therīgāthā 1.1/);
    let saved = idbSutta.saved;
    should(typeof saved).equal('number');

    // Load cached sutta
    let idbSutta2 = await suttas.loadIdbSutta(suttaRef);
    should.deepEqual(idbSutta2, idbSutta);

    // Don't refresh almost stale data
    let freshSaved = Date.now() - MSDAY + MSSEC;
    Idb.set(idbSutta.idbKey, Object.assign({}, idbSutta, {saved:freshSaved}));
    let idbSutta3 = await suttas.loadIdbSutta(suttaRef);
    should(idbSutta3.saved).equal(freshSaved);

    // Re-fetch stale sutta
    let staleSaved = Date.now() - MSDAY - 1;
    Idb.set(idbSutta.idbKey, Object.assign({}, idbSutta, {saved:staleSaved}));
    let idbSutta4 = await suttas.loadIdbSutta(suttaRef);
    let age = Date.now() - idbSutta4.saved;
    should(age).below(MSSEC);
  });
})

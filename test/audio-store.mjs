import should from "should";
import { setActivePinia, createPinia } from 'pinia';
import { SuttaRef } from 'scv-esm/main.mjs';
import { default as EbtSettings } from '../src/ebt-settings.mjs';
import { logger } from "log-instance";
import fetch from "node-fetch";
logger.logLevel = 'warn';

import { useSettingsStore } from '../src/stores/settings.mjs';
import { useAudioStore } from '../src/stores/audio.mjs';
import { default as IdbSutta } from "../src/idb-sutta.mjs";
import * as Idb from "idb-keyval";
import { ref, shallowRef, watch, watchEffect } from "vue";

const THIG1_1_SOMA = SuttaRef.create('thig1.1/en/soma');

// mock global environment
import "fake-indexeddb/auto";
global.window = {}
import 'mock-local-storage'

const MSSEC = 1000;
const MSDAY = 24*3600*MSSEC;
const SERVER_ROOT = 'https://s1.sc-voice.net/scv';

(typeof describe === 'function') && describe("audio-store.mjs", function () {
  beforeEach(() => {
    window.localStorage = global.localStorage
    setActivePinia(createPinia());
    global.fetch = global.fetch || fetch;
  });
  it("TESTTESTdefault state", ()=>{
    let audio = useAudioStore();
    should(audio).properties({
      nFetch: 0,
      nGet: 0,
      nSet: 0,
    });
  });
  it("TESTTESTsegmentAudioUrl()", ()=>{
    let audio = useAudioStore();
    let suttaRef = SuttaRef.create('thig1.1:0.1/en/sujato');
    should(audio.segmentAudioUrl(suttaRef)).equal(
      `${SERVER_ROOT}/play/segment/thig1.1/en/sujato/thig1.1:0.1/Amy`
    );
  });
  it("TESTTESTlangAudioUrl() pli", async()=>{
    let audio = useAudioStore();
    let sutta_uid = "thig1.1";
    let scid = `${sutta_uid}:0.1`;
    let vnameRoot = "Aditi";
    let langRoot = 'pli';
    let translator = 'ms';
    let guid = "56e190c8cde4e769f5458eab81949bc0";
    should(await audio.langAudioUrl(scid, 'pli')).equal([
      SERVER_ROOT,
      'audio',
      sutta_uid,
      langRoot,
      translator,
      vnameRoot,
      guid,
    ].join('/'));

    // Pali audio for English translation
    should(await audio.langAudioUrl(`${scid}/en/sujato`, 'pli')).equal([
      SERVER_ROOT,
      'audio',
      sutta_uid,
      langRoot,
      translator,
      vnameRoot,
      guid,
    ].join('/'));
  });
  it("TESTTESTlangAudioUrl() en", async()=>{
    let audio = useAudioStore();
    let sutta_uid = "thig1.1";
    let scid = `${sutta_uid}:0.1`;
    let vname = "Amy";
    let lang = 'en';
    let translator = 'sujato';
    let guid = "84df812bf23b0203e0181e83b2a51dc4";
    should(await audio.langAudioUrl(scid, lang)).equal([
      SERVER_ROOT,
      'audio',
      sutta_uid,
      lang,
      translator,
      vname,
      guid,
    ].join('/'));
  });
  it("TESTTESTlangAudioUrl() de", async()=>{
    let audio = useAudioStore();
    let sutta_uid = "thig1.1";
    let scid = `${sutta_uid}:0.1`;
    let vnameTrans = "Vicki";
    let lang = 'de';
    let translator = 'sabbamitta';
    let settings = new EbtSettings({lang, vnameTrans});
    let guid = "288ac06596ee8aa4f2e010eb6a895c46";
    should(await audio.langAudioUrl(scid, lang, settings)).equal([
      SERVER_ROOT,
      'audio',
      sutta_uid,
      lang,
      translator,
      vnameTrans,
      guid,
    ].join('/'));
  });
  it("TESTTESTfetchAudioBuffer()", async()=>{
    let audio = useAudioStore();
    let suttaRef = SuttaRef.create('thig1.1:0.1/en/sujato');
    let url = await audio.langAudioUrl(suttaRef, 'pli');
    let audioBuf = await audio.fetchAudioBuffer(url);
    should(audioBuf.byteLength).above(11640).below(11650);
  });
})

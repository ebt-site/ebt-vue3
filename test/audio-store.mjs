import should from "should";
import { setActivePinia, createPinia } from 'pinia';
import { SuttaRef } from 'scv-esm/main.mjs';
import { default as EbtSettings } from '../src/ebt-settings.mjs';
import { logger } from "log-instance/index.mjs";
import fetch from "node-fetch";
logger.logLevel = 'warn';

import { 
  useSettingsStore,
  useVolatileStore,
  useAudioStore,
} from '../src/index.mjs';
import { default as IdbSutta } from "../src/idb-sutta.mjs";
import * as Idb from "idb-keyval";
import { ref, shallowRef, watch, watchEffect } from "vue";

const THIG1_1_SOMA = SuttaRef.create('thig1.1/en/soma');

// mock global environment
import "fake-indexeddb/auto";
global.window = {
  location: {
    hash: undefined,
  },
}
import 'mock-local-storage'

const MSSEC = 1000;
const MSDAY = 24*3600*MSSEC;
const SERVER_ROOT = 'https://s1.sc-voice.net/scv';


(typeof describe === 'function') && describe("stores/audio.mjs", function () {
  this.timeout(5*1000);
  beforeEach(() => {
    window.localStorage = global.localStorage
    setActivePinia(createPinia());
    global.fetch = fetch;
  });
  it("default state", ()=>{
    let audio = useAudioStore();
    should(audio).properties({
      nFetch: 0,
      nGet: 0,
      nSet: 0,
      audioIndex: 0,
      audioSutta: null,
      audioScid: '',
    });
  });
  it("segmentAudioUrl() en", ()=>{
    let audio = useAudioStore();
    let suttaRef = SuttaRef.create('thig1.1:0.1/en/sujato');
    should(audio.segmentAudioUrl(suttaRef)).equal(
      `${SERVER_ROOT}/play/segment/thig1.1/en/sujato/thig1.1:0.1/Amy/Aditi`
    );
  });
  it("segmentAudioUrl() de", ()=>{
    let audio = useAudioStore();
    let sutta_uid = 'thig1.1';
    let scid = `${sutta_uid}:0.1`;
    let langTrans = 'de';
    let author = 'sabbamitta';
    let vnameTrans = 'Marlene';
    let vnameRoot = 'sujato_pli';
    let settings = new EbtSettings({langTrans,vnameTrans, vnameRoot});
    let suttaRef = SuttaRef.create(`${scid}/${langTrans}/${author}`);
    should(audio.segmentAudioUrl(suttaRef, settings)).equal([
      `${SERVER_ROOT}/play/segment`,
      sutta_uid,
      langTrans,
      author,
      scid,
      vnameTrans,
      vnameRoot,
    ].join('/'));
  });
  it("langAudioUrl() segAudio", async()=>{
    let audio = useAudioStore();
    let sutta_uid = "thig1.1";
    let scid = `${sutta_uid}:0.1`;
    let vnameRoot = "Aditi";
    let langRoot = 'pli';
    let translator = 'ms';
    let guid = "56e190c8cde4e769f5458eab81949bc0";
    let idOrRef = scid;
    let lang = 'pli';
    let segAudio = await audio.getSegmentAudio(idOrRef);
    let nFetch0 = audio.nFetch;
    should(await audio.langAudioUrl({idOrRef, lang, segAudio})).equal([
      SERVER_ROOT,
      'audio',
      sutta_uid,
      langRoot,
      translator,
      vnameRoot,
      guid,
    ].join('/'));
    should(audio.nFetch).equal(nFetch0);

    // Pali audio for English translation
    idOrRef = `${scid}/en/sujato`;
    should(await audio.langAudioUrl({idOrRef, lang, segAudio})).equal([
      SERVER_ROOT,
      'audio',
      sutta_uid,
      langRoot,
      translator,
      vnameRoot,
      guid,
    ].join('/'));
    should(audio.nFetch).equal(nFetch0);
  });
  it("langAudioUrl() pli", async()=>{
    let audio = useAudioStore();
    let sutta_uid = "thig1.1";
    let scid = `${sutta_uid}:0.1`;
    let vnameRoot = "Aditi";
    let langRoot = 'pli';
    let translator = 'ms';
    let guid = "56e190c8cde4e769f5458eab81949bc0";
    let idOrRef = scid;
    let lang = 'pli';
    should(await audio.langAudioUrl({idOrRef, lang})).equal([
      SERVER_ROOT,
      'audio',
      sutta_uid,
      langRoot,
      translator,
      vnameRoot,
      guid,
    ].join('/'));

    // Pali audio for English translation
    idOrRef = `${scid}/en/sujato`;
    should(await audio.langAudioUrl({idOrRef, lang})).equal([
      SERVER_ROOT,
      'audio',
      sutta_uid,
      langRoot,
      translator,
      vnameRoot,
      guid,
    ].join('/'));
  });
  it("langAudioUrl() en", async()=>{
    let audio = useAudioStore();
    let sutta_uid = "thig1.1";
    let scid = `${sutta_uid}:0.1`;
    let vname = "Amy";
    let langTrans = 'en';
    let translator = 'sujato';
    let guid = "84df812bf23b0203e0181e83b2a51dc4";
    let idOrRef = scid;
    should(await audio.langAudioUrl({idOrRef, lang:langTrans})).equal([
      SERVER_ROOT,
      'audio',
      sutta_uid,
      langTrans,
      translator,
      vname,
      guid,
    ].join('/'));
  });
  it("langAudioUrl() de", async()=>{
    let audio = useAudioStore();
    let sutta_uid = "thig1.1";
    let scid = `${sutta_uid}:0.1`;
    let vnameTrans = "Vicki";
    let vnameRoot = 'sujato_pli';
    let langTrans = 'de';
    let translator = 'sabbamitta';
    let settings = new EbtSettings({langTrans, vnameTrans, vnameRoot});
    should(settings.vnameTrans).equal(vnameTrans);
    let guid = "293c41636392500b0e85a1e8061f36ab";
    let idOrRef = scid;
    should(await audio.langAudioUrl({idOrRef:scid, lang:langTrans, settings}))
    .equal([
      SERVER_ROOT,
      'audio',
      sutta_uid,
      langTrans,
      translator,
      vnameTrans,
      guid,
    ].join('/'));
  });
  it("fetchArrayBuffer()", async()=>{
    let audio = useAudioStore();
    let lang = 'pli';
    let idOrRef = SuttaRef.create('thig1.1:0.1/en/sujato');
    let url = await audio.langAudioUrl({idOrRef, lang});
    let abuf = await audio.fetchArrayBuffer(url);
    should(abuf.byteLength).above(11640).below(11650);
  });
  it("bindSegmentAudio()", async()=>{
    let audio = useAudioStore();
    let volatile = useVolatileStore();
    let sutta_uid = 'thig1.1';
    let segnum = '0.2';
    let lang = 'en';
    let author = 'sujato';
    let idOrRef = `${sutta_uid}:${segnum}/${lang}/${author}`;
    let suttaRef = SuttaRef.create(idOrRef);
    global.window.location = {hash:null};
    let card = volatile.setRoute(`#/sutta/${idOrRef}`);
    let segAudio = await audio.bindSegmentAudio();
    let { vnameRoot, vnameTrans, langTrans } = segAudio;
    let url = `https://s1.sc-voice.net/scv/audio/${sutta_uid}`;
    let pliGuid = '44e4c425d93b9146ef5b8b16cbd8bac5';
    should(audio.pliAudioUrl)
      .equal(`${url}/pli/${author}/${vnameRoot}/${pliGuid}`);
    let transGuid = '9767a87089cddaaecc32e37d20531fb9';
    should(langTrans).equal(lang);
    should(audio.transAudioUrl)
      .equal(`${url}/${langTrans}/${author}/${vnameTrans}/${transGuid}`);
  });
})

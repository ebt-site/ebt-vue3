import should from "should";
import { setActivePinia, createPinia } from 'pinia';
import { SuttaRef } from 'scv-esm/main.mjs';
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
      maxAge: MSDAY,
    });
  });
  it("TESTTESTsegmentAudioUrl()", ()=>{
    let audio = useAudioStore();
    let suttaRef = SuttaRef.create('thig1.1:0.1/en/sujato');
    should(audio.segmentAudioUrl(suttaRef)).equal(
      `${SERVER_ROOT}/play/segment/thig1.1/en/sujato/thig1.1:0.1/Amy`
    );
  });
  it("TESTTESTrootAudioUrl()", ()=>{
    let audio = useAudioStore();
    let sutta_uid = "thig1.1";
    let scid = `${sutta_uid}:0.1`;
    let vnameRoot = "Aditi";
    let langRoot = 'pli';
    let translator = 'ms';
    let guid = "56e190c8cde4e769f5458eab81949bc0";
    let audioSeg = { // unused fields omitted
      sutta_uid,
      scid,
      vnameRoot,
      segment: {
        scid,
        "pli": "Therīgāthā 1.1 ",
        audio: {
          "pli": guid,
        }
      }
    }
    should(audio.rootAudioUrl(audioSeg)).equal([
      SERVER_ROOT,
      'audio',
      sutta_uid,
      langRoot,
      translator,
      vnameRoot,
      guid,
    ].join('/'));
  });
  it("TESTTESTtranslationAudioUrl()", ()=>{
    let audio = useAudioStore();
    let sutta_uid = "thig1.1";
    let scid = `${sutta_uid}:0.1`;
    let vnameTrans = "Amy";
    let langTrans = 'en';
    let translator = 'sujato';
    let guid = '84df812bf23b0203e0181e83b2a51dc4';
    let audioSeg = { // unused fields omitted
      sutta_uid,
      scid,
      langTrans,
      translator,
      "section": 0,
      vnameTrans,
      segment: {
        scid,
        "en": "Verses of the Senior Nuns 1.1 ",
        audio: {
          en: guid,
        }
      }
    }
    should(audio.translationAudioUrl(audioSeg)).equal([
      SERVER_ROOT,
      'audio',
      sutta_uid,
      langTrans,
      translator,
      vnameTrans,
      guid,
    ].join('/'));
  });
})

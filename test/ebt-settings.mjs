import { default as EbtSettings } from "../src/ebt-settings.mjs";
import { default as EbtCard } from "../src/ebt-card.mjs";
import should from "should";

(typeof describe === 'function') && describe("ebt-settings.mjs", function () {
  it("default ctor en", async () => {
    global.navigator = { languages: ['en-US'] };
    var ebt = new EbtSettings();
    should(ebt).properties({
      audio: EbtSettings.AUDIO.OGG,
      clickVolume: 2,
      blockVolume: 2,
      swooshVolume: 2,
      fullLine: false,
      ips: 6,
      langTrans: 'en',
      docLang: 'en',
      docAuthor: 'sujato',
      maxResults: 5,
      refLang: 'en',
      refAuthor: 'sujato',
      showId: false,
      showPali: true,
      speakPali: true,
      showReference: false,
      showSutta: true,
      showTrans: true,
      showVinaya: false,
      vnameRoot: 'Aditi',
      vnameTrans: 'Amy',

    });
    let keys = Object.keys(ebt);
    should(keys.indexOf('loaded')).equal(-1);
  });
  it("default ctor de-de", async () => {
    try {
      global.navigator = { languages: ['de-de'] };
      should(global.navigator.languages[0]).equal('de-de');
      let ebt = new EbtSettings();
      should(ebt).properties({
        audio: EbtSettings.AUDIO.OGG,
        fullLine: false,
        ips: 6,
        langTrans: 'de',
        docAuthor: 'sabbamitta',
        maxResults: 5,
        refLang: 'en',
        refAuthor: 'sujato',
        showId: false,
        showPali: true,
        showReference: false,
        showSutta: true,
        showTrans: true,
        showVinaya: false,
        vnameRoot: 'Aditi',
        vnameTrans: 'Vicki',
      });
    } finally {
      global.navigator = { languages: ['en-us'] };
    }
  });
  it("INITIAL_STATE", async () => {
    should(EbtSettings.INITIAL_STATE).properties({
      audio: 'ogg',
      audioSuffix: 'mp3',
      blockVolume: 2,
      clickVolume: 2,
      docLang: 'en',
      docAuthor: 'sujato',
      fullLine: false,
      id: 1,
      ips: 6,
      langRoot: 'pli',
      langs: 'pli+en',
      langTrans: 'en',
      langTrans: 'en',
      locale: 'en',
      maxDuration: 3*60*60,
      maxResults: 5,
      refLang: 'en',
      refAuthor: 'sujato',
      scid: undefined,
      serverUrl: 'https://s1.sc-voice.net/scv',
      showGdpr: true,
      showId: false,
      showPali: true,
      showReference: false,
      showTrans: true,
      sutta_uid: undefined,
      swooshVolume: 2,
      theme: 'dark',
      translator: 'sujato',
      vnameRoot: 'Aditi',
      vnameTrans: 'Amy',

    });
    let cards = EbtSettings.INITIAL_STATE.cards;
    should(cards instanceof Array);
    should(cards.length).equal(0);
  });
  it("custom ctor", async () => {
    let dates = [
      new Date(2021, 1, 1),
      new Date(2021, 2, 2),
      new Date(2021, 3, 3),
    ];
    let clickVolume = 4;
    let blockVolume = 3;
    let swooshVolume = 1;
    let showId = true;
    let showPali = false;
    var ebt = new EbtSettings({
      clickVolume,
      blockVolume,
      swooshVolume,
      showId,
      showPali,
    });

    should(ebt).properties({
      clickVolume,
      blockVolume,
      swooshVolume,
      showId,
      showPali,
    });
  });
  it("REF_LANGUAGES => reference languages", () => {
    should.deepEqual(EbtSettings.REF_LANGUAGES.map(tl => tl.code).sort(), [
      'de',
      'en',
    ]);
  });
  it("TRANS_LANGUAGES => translation languages", () => {
    should.deepEqual(EbtSettings.TRANS_LANGUAGES.map(tl => tl.code).sort(), [
      'cs',
      'de',
      'en',
      'ja',
      'pt',
    ]);
  });
  it("segmentRef()", ()=>{
    let langTrans = 'de';
    let author = 'sabbamitta';
    let settings = new EbtSettings({langTrans});
    let segnum = '1.0';
    should(EbtSettings.segmentRef("thig1.1", settings)).properties({
      sutta_uid: 'thig1.1',
      lang: langTrans,
      author, 
      segnum,
    });
    should(EbtSettings.segmentRef("thig1.1:2.3/en/soma", settings)).properties({
      sutta_uid: 'thig1.1',
      lang: 'en',
      author: 'soma', 
      segnum: '2.3',
    });
    should(EbtSettings.segmentRef("thig1.1:2.3/en", settings)).properties({
      sutta_uid: 'thig1.1',
      lang: 'en',
      author: 'sujato', 
      segnum: '2.3',
    });
    should(EbtSettings.segmentRef("thig1.1:2.3/pli", settings)).properties({
      sutta_uid: 'thig1.1',
      lang: 'pli',
      author: 'ms', 
      segnum: '2.3',
    });
  });
  it("validate() de", ()=>{
    let state = {
      langTrans: 'de',
      docLang: 'en',
      docAuthor: 'sujato',
      vnameTrans: 'Amy',
      refAuthor: 'sujato',
      refLang: 'pt',
      speakPali: false,
      speakTrans: false,
      showPali: false,
      showTranslation: false,
      showReference: false,
    }
    let res = EbtSettings.validate(state);
    should(res.isValid).equal(true);
    should(!!res.error).equal(false);
    should.deepEqual(res.changed, {
      docAuthor: 'sabbamitta',
      docLang: 'de',
      refAuthor: 'laera-quaresma',
      showPali:true, 
      showSutta: true,
      showVinaya: false,
      speakPali:true, 
      vnameTrans:'Vicki',

    });
  });
  it("validate() ja", ()=>{
    let state = {
      langTrans: 'ja',
      vnameTrans: 'Amy',
      speakPali: false,
      speakTrans: false,
      showPali: false,
      showTranslation: false,
      showReference: false,
    }
    let res = EbtSettings.validate(state);
    should(res.isValid).equal(true);
    should(!!res.error).equal(false);
    should.deepEqual(res.changed, {
      docAuthor: 'kaz',
      docLang: 'jpn',
      refAuthor: 'sujato',
      refLang: 'en',
      showPali:true, 
      showSutta: true,
      showVinaya: false,
      speakPali:true, 
      vnameTrans:'Takumi',

    });
    should.deepEqual(state, {
      docAuthor: 'kaz',
      docLang: 'jpn',
      langTrans: 'ja',
      refAuthor: 'sujato',
      refLang: 'en',
      showPali: true,
      showReference: false,
      showSutta: true,
      showTranslation: false,
      showVinaya: false,
      speakPali: true,
      speakTrans: false,
      vnameTrans:'Takumi',

    });

    should.deepEqual(EbtSettings.validate(state), {
      isValid: true,
      changed: null,
      error: null,
    });
  });

});

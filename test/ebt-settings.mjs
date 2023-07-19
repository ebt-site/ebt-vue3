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
      maxResults: 5,
      refLang: 'en',
      showId: false,
      showPali: true,
      speakPali: true,
      showReference: false,
      showTrans: true,
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
        maxResults: 5,
        refLang: 'de',
        showId: false,
        showPali: true,
        showReference: false,
        showTrans: true,
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
      clickVolume: 2,
      blockVolume: 2,
      swooshVolume: 2,
      fullLine: false,
      id: 1,
      ips: 6,
      showGdpr: true,
      langTrans: 'en',
      langRoot: 'pli',
      langs: 'pli+en',
      langTrans: 'en',
      locale: 'en',
      maxDuration: 3*60*60,
      maxResults: 5,
      refLang: 'en',
      showId: false,
      showPali: true,
      showReference: false,
      showTrans: true,
      scid: undefined,
      serverUrl: 'https://s1.sc-voice.net/scv',
      sutta_uid: undefined,
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
  it("TESTTESTsegmentRef()", ()=>{
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
  it("TESTTESTvalidate()", ()=>{
    let state = {
      langTrans: 'de',
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
      showPali:true, speakPali:true, vnameTrans:'Vicki'});
    should.deepEqual(state, {
      langTrans: 'de',
      vnameTrans: 'Vicki',
      speakPali: true,
      speakTrans: false,
      showPali: true,
      showTranslation: false,
      showReference: false,
    });

    should.deepEqual(EbtSettings.validate(state), {
      isValid: true,
      changed: null,
      error: null,
    });
  });

});

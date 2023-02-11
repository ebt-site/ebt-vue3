import { default as Settings } from "../src/ebt-settings.mjs";
import { default as EbtCard } from "../src/ebt-card.mjs";
import should from "should";

(typeof describe === 'function') && describe("ebt-settings.mjs", function () {
  it("default ctor en", async () => {
    global.navigator = { languages: ['en-US'] };
    var ebt = new Settings();
    should(ebt).properties({
      audio: Settings.AUDIO.OGG,
      clickVolume: 2,
      fullLine: false,
      ips: 6,
      langTrans: 'en',
      loaded: false,
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
      let ebt = new Settings();
      should(ebt).properties({
        audio: Settings.AUDIO.OGG,
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
    should(Settings.INITIAL_STATE).properties({
      audio: 'ogg',
      audioSuffix: 'mp3',
      clickVolume: 2,
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
    let cards = Settings.INITIAL_STATE.cards;
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
    let showId = true;
    let showPali = false;
    var ebt = new Settings({
      clickVolume,
      showId,
      showPali,
    });

    should(ebt).properties({
      clickVolume,
      showId,
      showPali,
    });
  });
  it("REF_LANGUAGES => reference languages", () => {
    should.deepEqual(Settings.REF_LANGUAGES.map(tl => tl.code).sort(), [
      'de',
      'en',
    ]);
  });
  it("TRANS_LANGUAGES => translation languages", () => {
    should.deepEqual(Settings.TRANS_LANGUAGES.map(tl => tl.code).sort(), [
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
    let settings = new Settings({langTrans});
    let segnum = '1.0';
    should(Settings.segmentRef("thig1.1", settings)).properties({
      sutta_uid: 'thig1.1',
      lang: langTrans,
      author, 
      segnum,
    });
    should(Settings.segmentRef("thig1.1:2.3/en/soma", settings)).properties({
      sutta_uid: 'thig1.1',
      lang: 'en',
      author: 'soma', 
      segnum: '2.3',
    });
    should(Settings.segmentRef("thig1.1:2.3/en", settings)).properties({
      sutta_uid: 'thig1.1',
      lang: 'en',
      author: 'sujato', 
      segnum: '2.3',
    });
    should(Settings.segmentRef("thig1.1:2.3/pli", settings)).properties({
      sutta_uid: 'thig1.1',
      lang: 'pli',
      author: 'ms', 
      segnum: '2.3',
    });
  });

});

import { default as Settings } from "../src/ebt-settings.mjs";
import { default as EbtCard } from "../src/ebt-card.mjs";
import should from "should";

(typeof describe === 'function') && describe("ebt-settings.mjs", function () {
  it("TESTTESTdefault ctor en", async () => {
    global.navigator = { languages: ['en-US'] };
    var ebt = new Settings();
    should(ebt).properties({
      audio: Settings.AUDIO.OGG,
      clickVolume: 2,
      fullLine: false,
      ips: 6,
      lang: 'en',
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
  });
  it("TESTTESTdefault ctor de-de", async () => {
    try {
      global.navigator = { languages: ['de-de'] };
      should(global.navigator.languages[0]).equal('de-de');
      let ebt = new Settings();
      should(ebt).properties({
        audio: Settings.AUDIO.OGG,
        fullLine: false,
        ips: 6,
        lang: 'de',
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
      lang: 'en',
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
    should(cards.length).equal(1);
    should(cards[0]).instanceOf(EbtCard);
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

});

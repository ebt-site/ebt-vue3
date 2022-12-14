import { logger } from 'log-instance';
import { default as EbtCard } from './ebt-card.mjs';
import { default as VOICES } from './auto/voices.mjs';
import { SuttaRef, Authors } from 'scv-esm/main.mjs';

const AUDIO = { MP3: 'mp3', OGG: 'ogg', OPUS: 'opus', };

const SERVERS = [{
  title: 's1.sc-voice.net',
  value: 'https://s1.sc-voice.net/scv',
  hint: 'ScvServer (Linode staging)',
},{
  title: 'voice.suttacentral.net',
  value: 'https://voice.suttacentral.net/scv',
  hint: 'Voice server (AWS production)',
},{
  title: 's2.sc-voice.net',
  value: 'https://s2.sc-voice.net/scv',
  hint: 'Voice server (Linode staging)',
},{
  title: 'localhost:8080',
  value: 'http://localhost:8080/scv',
  hint: 'ScvServer (localhost development)',
  dev: true,
}];

export default class Settings {
  constructor(opts = {}) {
    let {
      audio,
      clickVolume,
      fullLine,
      highightExamples,
      ips,
      langTrans,
      locale,
      maxResults,
      refLang,
      serverUrl,
      showId,
      showPali,
      speakPali,
      speakTranslation,
      showTrans,
      showReference,
      vnameRoot,
      vnameTrans,

    } = Object.assign({}, Settings.INITIAL_STATE, opts);
    (opts.logger || logger).logInstance(this, opts);

    this.audio = audio;
    this.clickVolume = clickVolume;
    this.fullLine = fullLine;
    this.ips = 6;
    this.langTrans = Settings.TRANS_LANGUAGES.reduce((a, l) => {
      return l.code === langTrans ? langTrans : a;
    }, 'en');
    this.locale = Settings.WEB_LANGUAGES.reduce((a, l) => {
      return l.code === locale ? locale : a;
    }, 'en');
    this.maxResults = maxResults;
    this.refLang = refLang;
    this.serverUrl = serverUrl,
    this.showId = showId;
    this.showPali = showPali;
    this.speakPali = speakPali;
    this.speakTranslation = speakTranslation;
    this.showReference = showReference;
    this.showTrans = showTrans;
    this.vnameRoot = vnameRoot;
    this.vnameTrans = vnameTrans;

  }

  static get SERVERS() {
    return SERVERS;
  }

  static get INITIAL_STATE() {
    let NAV_LANG = typeof navigator === 'undefined'
      ? 'en'
      : navigator.languages[0].split('-')[0];
    let vnameTrans = VOICES.reduce((a,v)=>{
      return !a && v.langTrans === NAV_LANG ? v.name : a;
    }, undefined) || 'Amy';

    return {
      // from scv-server
      audioSuffix: 'mp3',
      clickVolume: 2,
      highlightExamples: false,
      id: 1,
      showGdpr: true,
      langRoot: 'pli',
      langs: `pli+${NAV_LANG}`,
      langTrans: NAV_LANG,
      logLevel: 'warn',
      maxDuration: 3*60*60,
      scid: undefined,
      serverUrl: SERVERS[0].value,
      sutta_uid: undefined,
      theme: 'dark',
      translator: 'sujato',

      // from ebt-vue
      audio: AUDIO.OGG,
      fullLine: false,
      ips: 6,
      locale: NAV_LANG,
      maxResults: 5,
      refLang: NAV_LANG,
      showId: false,
      showPali: true,
      speakPali: true,
      speakTranslation: true,
      showReference: false,
      showTrans: true,
      vnameRoot: 'Aditi',
      vnameTrans,
      cards: [new EbtCard()],
    }
  }

  static get REF_LANGUAGES() {
    return [{
      code: 'de',
      label: 'Sabbamitta / DE',
    }, {
      code: 'en',
      label: 'Sujato / EN',
    }];
  }

  static get TRANS_LANGUAGES() {
    return [{
      code: 'cs',
      label: '??e??tina / CS',
      //}, {
      //code: 'da',
      //label: 'Dansk / DA',
    }, {
      code: 'de',
      label: 'Deutsch / DE',
    }, {
      code: 'en',
      label: 'English / EN',
      //}, {
      //code: 'fr',
      //label: 'Fran??ais / FR',
      //}, {
      //code: 'hi',
      //label: '??????????????? / HI',
      //}, {
      //code: 'is',
      //label: '??slenska / IS',
    }, {
      code: 'ja',
      label: '????????? / JA',
      //}, {
      //code: 'nb',
      //label: 'Norsk / NB',
      //}, {
      //code: 'nl',
      //label: 'Nederlands / NL',
      //}, {
      //code: 'pl',
      //label: 'Polski / PL',
    }, {
      code: 'pt',
      label: 'Portugu??s / PT',
      //}, {
      //code: 'ro',
      //label: 'Rom??n?? / RO',
      //}, {
      //code: 'si',
      //label: '??????????????? / SI',
      //}, {
      //code: 'vi',
      //label: 'Ti???ng Vi???t / VI',
    }];
  }

  static get WEB_LANGUAGES() {
    return [{
      code: 'cs',
      label: '??e??tina / CS',
    }, {
      code: 'da',
      label: 'Dansk / DA',
    }, {
      code: 'de',
      label: 'Deutsch / DE',
    }, {
      code: 'en',
      label: 'English / EN',
    }, {
      code: 'fr',
      label: 'Fran??ais / FR',
    }, {
      code: 'hi',
      label: '??????????????? / HI',
    }, {
      code: 'is',
      label: '??slenska / IS',
    }, {
      code: 'ja',
      label: '????????? / JA',
    }, {
      code: 'nb',
      label: 'Norsk / NB',
    }, {
      code: 'nl',
      label: 'Nederlands / NL',
    }, {
      code: 'pl',
      label: 'Polski / PL',
    }, {
      code: 'pt',
      label: 'Portugu??s / PT',
    }, {
      code: 'ro',
      label: 'Rom??n?? / RO',
    }, {
      code: 'si',
      label: '??????????????? / SI',
    }, {
      code: 'vi',
      label: 'Ti???ng Vi???t / VI',
    }];
  }

  static get IPS_CHOICES() {
    return [{
      url: '',
      i18n: 'bellNone',
      value: 0,
    //}, {
      //url: '',
      //i18n: 'bellRainforest',
      //volume: 0.1,
      //value: 1,
      //hide: true,
    }, {
      url: '/audio/indian-bell-flemur-sampling-plus-1.0.mp3',
      i18n: 'bellIndian',
      volume: 0.1,
      value: 2,
    }, {
      url: '/audio/tibetan-singing-bowl-horst-cc0.mp3',
      i18n: "bellTibetan",
      volume: 0.3,
      value: 3,
    }, {
      url: '/audio/jetrye-bell-meditation-cleaned-CC0.mp3',
      i18n: "bellMeditation",
      volume: 0.1,
      value: 4,
      hide: true,
    }, {
      url: '/audio/STE-004-Coemgenu.mp3',
      i18n: "bellMidrange",
      volume: 0.5,
      value: 5,
    }, {
      url: '/audio/simple-bell.mp3',
      i18n: "bellSimple",
      volume: 0.5,
      value: 6,
    }];
  }

  static langLabel(lang) {
    let info = Settings.WEB_LANGUAGES.find(l => l.code === lang) || {
      label: `unknown language:${lang}`
    };
    return info.label;
  }

  static get AUDIO() {
    return AUDIO;
  }

  static segmentRef(idOrRef, settings=Settings.INITIAL_STATE) {
    let { sutta_uid, author, lang:langTrans, segnum='1.0' } = 
      SuttaRef.create(idOrRef, settings.langTrans);
    if (author == null) {
      author = Authors.langAuthor(langTrans)
    }
    return SuttaRef.create({ sutta_uid, author, lang:langTrans, segnum });
  }

}

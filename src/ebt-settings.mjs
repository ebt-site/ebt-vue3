import { logger } from 'log-instance';
import { default as EbtCard } from './ebt-card.mjs';
import { default as VOICES } from './auto/voices.mjs';

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

export default class EbtSettings {
  constructor(opts = {}) {
    let {
      audio,
      clickOnTap,
      iCursor,
      fullLine,
      highightExamples,
      history,
      ips,
      lang,
      locale,
      maxHistory,
      maxResults,
      refLang,
      saveSettingsExamples,
      saveSettings,
      showId,
      showPali,
      showTrans,
      showReference,
      vnameRoot,
      vnameTrans,

    } = Object.assign({}, EbtSettings.INITIAL_STATE, opts);
    (opts.logger || logger).logInstance(this, opts);

    this.audio = audio;
    this.clickOnTap = clickOnTap;
    this.iCursor = iCursor;
    this.fullLine = fullLine;
    this.history = history.reduce((a, h) => {
      if (h != null) {
        let date = typeof h.date === 'string'
          ? new Date(h.date)
          : h.date;
        a.push(Object.assign({}, h, { date }));
      }
      return a;
    }, []);
    this.history.sort((a, b) => a.date - b.date);
    this.ips = 6;
    this.lang = EbtSettings.TRANS_LANGUAGES.reduce((a, l) => {
      return l.code === lang ? lang : a;
    }, 'en');
    this.locale = EbtSettings.WEB_LANGUAGES.reduce((a, l) => {
      return l.code === locale ? locale : a;
    }, 'en');
    this.maxResults = maxResults;
    this.maxHistory = maxHistory;
    this.refLang = refLang;
    this.saveSettingsExamples = saveSettingsExamples;
    this.saveSettings = saveSettings;
    this.showId = showId;
    this.showPali = showPali;
    this.showReference = showReference;
    this.showTrans = showTrans;
    this.vnameRoot = vnameRoot;
    this.vnameTrans = vnameTrans;

  }

  toJSON() {
    let { maxHistory, history, iCursor } = this;
    let json = Object.assign({}, this);
    let trimHistory = history.slice();
    iCursor = Math.min(trimHistory.length - 1, iCursor);
    while (JSON.stringify(trimHistory).length > maxHistory) {
      trimHistory.pop();
    }
    json.history = trimHistory;
    return json;
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
      clickOnTap: true,
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
      history: [],
      iCursor: 0,
      ips: 6,
      lang: NAV_LANG,
      locale: NAV_LANG,
      maxHistory: 2000,
      maxResults: 5,
      refLang: NAV_LANG,
      saveSettingsExamples: false,
      saveSettings: false,
      showId: false,
      showPali: true,
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
      label: 'Čeština / CS',
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
      //label: 'Français / FR',
      //}, {
      //code: 'hi',
      //label: 'हिंदी / HI',
      //}, {
      //code: 'is',
      //label: 'Íslenska / IS',
    }, {
      code: 'ja',
      label: '日本語 / JA',
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
      label: 'Português / PT',
      //}, {
      //code: 'ro',
      //label: 'Română / RO',
      //}, {
      //code: 'si',
      //label: 'සිංහල / SI',
      //}, {
      //code: 'vi',
      //label: 'Tiếng Việt / VI',
    }];
  }

  static get WEB_LANGUAGES() {
    return [{
      code: 'cs',
      label: 'Čeština / CS',
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
      label: 'Français / FR',
    }, {
      code: 'hi',
      label: 'हिंदी / HI',
    }, {
      code: 'is',
      label: 'Íslenska / IS',
    }, {
      code: 'ja',
      label: '日本語 / JA',
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
      label: 'Português / PT',
    }, {
      code: 'ro',
      label: 'Română / RO',
    }, {
      code: 'si',
      label: 'සිංහල / SI',
    }, {
      code: 'vi',
      label: 'Tiếng Việt / VI',
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
    let info = EbtSettings.WEB_LANGUAGES.find(l => l.code === lang) || {
      label: `unknown language:${lang}`
    };
    return info.label;
  }

  static get AUDIO() {
    return AUDIO;
  }

}

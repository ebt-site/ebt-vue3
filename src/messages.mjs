import { default as Languages } from "./languages.mjs"

var MESSAGES;

export default class Messages {
  static get MESSAGES() { 
    return (async () => {
      if (MESSAGES == null) {
        MESSAGES = {};
        let { UI_LANGS } = Languages;
        for (let i = 0; i < UI_LANGS.length; i++) {
          let { value:lang } = UI_LANGS[i];
          let fname = `./i18n/${lang}.mjs`;
          let langInfo = await import(fname /* @vite-ignore */);
          MESSAGES[lang] = langInfo.default;
        }
      }
      return MESSAGES; 
    })();
  }
}


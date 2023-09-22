#!/usr/bin/env node
const fs = require("fs");
const path = require( "path");
const tsImport = require("ts-import");

const I18NDIR = path.join(__dirname, '../src/i18n');

let args = process.argv;
let [nodePath, progPath, key, value] = args;
let script = path.basename(progPath);
let voices = require('../src/auto/voices.json')
  .reduce((a,v) => {
    a[v.langTrans] = true;
    return a;
  }, {});;

(async ()=>{
  let files = await fs.promises.readdir(I18NDIR);
  let langs = [];
  for (f of files) {
    let fpath = path.join(I18NDIR, f);
    let lang = f.replace(/\..*/,'');
    let json = await tsImport.load(fpath)
    let languageCode = json.default?.ebt?.languageCode;
    langs.push({
      value: lang,
      title: languageCode,
      voice: !!voices[lang],
    });
    langs.sort((a,b)=> a.value.localeCompare(b.value));
  }
  let voiceLangs = langs.filter(lang=>lang.voice);
  console.log(`
// GENERATED CODE (DO NOT EDIT)
const VOICE_LANGS = ${JSON.stringify(voiceLangs, null, 2)};
const UI_LANGS = ${JSON.stringify(langs, null, 2)};

export default class Languages {
  static get VOICE_LANGS() { return VOICE_LANGS };
  static get UI_LANGS() { return UI_LANGS };
}
`);

})()


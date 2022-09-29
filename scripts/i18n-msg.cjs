#!/usr/bin/env node
const fs = require("fs");
const path = require( "path");
const tsImport = require("ts-import");

const I18NDIR = path.join(__dirname, '../src/i18n');

let args = process.argv;
let [nodePath, progPath, key, value] = args;
let script = path.basename(progPath);

if (key == null) {
  console.log("Expected:");
  console.log(`  ${script} KEY VALUE`);
  process.exit();
  throw new Error("ERROR");
}

(async ()=>{
  let files = await fs.promises.readdir(I18NDIR);
  for (f of files) {
    let fpath = path.join(I18NDIR, f);
    let json = await tsImport.load(fpath)
    let { ebt }  = json.default;
    if (value) {
      ebt[key] = value;
      console.log(`FILE: ${fpath} => ${key}: "${ebt[key]}"`);
      let sortedJson = Object.keys(json.default).reduce((a,v,i)=>{
      }, {});
      let ts = 'export default ' + JSON.stringify(json.default, null, 2);
      fs.promises.writeFile(fpath, ts);
    } else if (value === "") {
      delete ebt[key];
      let ts = 'export default ' + JSON.stringify(json.default, null, 2);
      fs.promises.writeFile(fpath, ts);
      console.log(`FILE: ${fpath} ${key}: (deleted)`);
    } else {
      let value = ebt[key] == null ? "undefined" : `"${ebt[key]}"`;
      console.log(`FILE: ${fpath} ${key}: ${value}`);
    }
  }
})()


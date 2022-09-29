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
    let srcJson = await tsImport.load(fpath)
    let dstJson = srcJson.default;
    let { ebt }  = dstJson;
    if (value) {
      ebt[key] = value;
      console.log(`FILE: ${fpath} => ${key}: "${ebt[key]}"`);
      let ebtKeys = Object.keys(ebt).sort();
      let ebtSorted = ebtKeys.reduce((a,key,i)=>{
        a[key] = ebt[key];
        return a;
      }, {});
      dstJson.ebt = ebtSorted;
      let ts = 'export default ' + JSON.stringify(dstJson, null, 2);
      fs.promises.writeFile(fpath, ts);
    } else if (value === "") {
      delete ebt[key];
      let ts = 'export default ' + JSON.stringify(dstJson, null, 2);
      fs.promises.writeFile(fpath, ts);
      console.log(`FILE: ${fpath} ${key}: (deleted)`);
    } else {
      let value = ebt[key] == null ? "undefined" : `"${ebt[key]}"`;
      console.log(`FILE: ${fpath} ${key}: ${value}`);
    }
  }
})()


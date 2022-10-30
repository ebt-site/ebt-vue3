#!/usr/bin/env node
const fs = require("fs");
const path = require( "path");
const tsImport = require("ts-import");

const I18NDIR = path.join(__dirname, '../src/i18n');

let args = process.argv;
let [nodePath, progPath, keyPath, value] = args;
let script = path.basename(progPath);

if (keyPath == null) {
  console.log("Expected:");
  console.log(`  ${script} KEYPATH VALUE`);
  process.exit();
  throw new Error("ERROR");
}
if (keyPath.indexOf('.') < 0) {
  keyPath = `ebt.${keyPath}`;
}

(async ()=>{
  let files = await fs.promises.readdir(I18NDIR);
  for (f of files) {
    let fpath = path.join(I18NDIR, f);
    let srcJson = await tsImport.load(fpath)
    let dstJson = srcJson.default;
    let groupObj = dstJson;
    let groupParent;
    let groupKey;
    let groupKeys = keyPath.split('.');
    let key = groupKeys.pop();

    while (groupKeys.length) {
      groupKey = groupKeys.shift();
      groupObj[groupKey] = groupObj[groupKey] || {};
      groupParent = groupObj;
      groupObj = groupObj[groupKey];
    }
    if (value === "DELETE") {
      delete groupObj[key];
      let ts = 'export default ' + JSON.stringify(dstJson, null, 2);
      fs.promises.writeFile(fpath, ts);
      console.log(`FILE: ${fpath} ${keyPath}: (deleted)`);
    } else if (value != null) {
      groupObj[key] = value;
      console.log(`FILE: ${fpath} => ${keyPath}: "${groupObj[key]}"`);
      let groupKeys = Object.keys(groupObj).sort();
      let groupSorted = groupKeys.reduce((a,key,i)=>{
        a[key] = groupObj[key];
        return a;
      }, {});
      groupParent[groupKey] = groupSorted;
      let ts = 'export default ' + JSON.stringify(dstJson, null, 2);
      fs.promises.writeFile(fpath, ts);
    } else {
      let value = groupObj[key] == null ? "undefined" : `"${groupObj[key]}"`;
      console.log(`FILE: ${fpath} ${keyPath}: ${value}`);
    }
  }
})()


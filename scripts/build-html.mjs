import { default as EbtMarkdown } from '../src/ebt-markdown.mjs';
import fs from 'fs';
const { promises: fsp } = fs;
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRCDIR = path.join(__dirname, '../content/wiki');
const DSTDIR = path.join(__dirname, '../dist/wiki');


let fname = './content/wiki/welcome.md';

async function convertFile(fnSrc, fnDst) {
  let markdown = fs.readFileSync(fname).toString();
  let emd = new EbtMarkdown(markdown);
  await fsp.mkdir(DSTDIR, {recursive:true});
  await fsp.writeFile(fnDst, emd.htmlLines.join('\n'));
}


let fnSrc = path.join(SRCDIR, 'welcome.md');
let fnDst = path.join(DSTDIR, 'welcome.html');
convertFile(fnSrc, fnDst);



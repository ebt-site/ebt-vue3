import fs from 'fs';
const { promises: fsp } = fs;
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { default as CmarkGfmRenderer } from './cmark-gfm-renderer.mjs';
import { default as EbtMarkdown } from '../src/ebt-markdown.mjs';
import { default as EbtConfig } from '../ebt-config.mjs';
const SRCDIR = path.join(__dirname, '../content');
const DSTDIR = path.join(__dirname, '../public/wiki');

let wikiPath = 'wiki/welcome';
let fname = `${SRCDIR}/${wikiPath}.md`;

const renderer = new CmarkGfmRenderer();

async function convertFile(fnSrc, fnDst) {
  let markdown = fs.readFileSync(fname).toString();
  let basePath = "/ebt-vue3/";
  let emd = new EbtMarkdown({basePath, wikiPath, renderer});
  let htmlLines = await emd.render(markdown);
  await fsp.mkdir(DSTDIR, {recursive:true});
  let cssPath = `${basePath}/wiki/ebt.css`;
  //htmlLines.unshift(`<link rel="stylesheet" href="${cssPath}">`);
  let html = htmlLines.join('\n');
  await fsp.writeFile(fnDst, html);
}

let fnSrc = path.join(SRCDIR, 'welcome.md');
let fnDst = path.join(DSTDIR, 'welcome.html');
convertFile(fnSrc, fnDst);



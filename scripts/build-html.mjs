import fs from 'fs';
const { promises: fsp } = fs;
import path from 'path';
import { logger } from 'log-instance';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { default as EbtConfig } from '../ebt-config.mjs';
import { default as HtmlFactory } from './html-factory.mjs';
const srcDir = path.join(__dirname, '../content');
const dstDir = path.join(__dirname, '../public/content');
const wikiPath = 'wiki/home';

let hf = new HtmlFactory({
  srcDir, 
  dstDir,
  wikiPath,
});
hf.build();

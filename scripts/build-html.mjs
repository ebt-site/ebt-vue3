import fs from 'fs';
const { promises: fsp } = fs;
import path from 'path';
import { logger } from 'log-instance';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { default as config } from '../ebt-config.mjs';
import { default as ChannelFactory } from './channel-factory.mjs';
const srcDir = path.join(__dirname, '../content');
const dstDir = path.join(__dirname, '../public/content');
const wikiPath = config.homePath;

let hf = new ChannelFactory({
  srcDir, 
  dstDir,
  wikiPath,
  config,
});
hf.build();

import fs from 'fs';
const { promises: fsp } = fs;
import path from 'path';
import { logger } from 'log-instance';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { default as CmarkGfmRenderer } from './cmark-gfm-renderer.mjs';
import { default as EbtMarkdown } from '../src/ebt-markdown.mjs';
import { default as EbtConfig } from '../ebt-config.mjs';
const SRCDIR = path.join(__dirname, '../content');
const DSTDIR = path.join(__dirname, '../public/content');
const wikiPath = 'wiki/home';

class HtmlFactory {
  constructor(opts={}) {
    this.renderer = opts.renderer || new CmarkGfmRenderer();
    this.srcDir = opts.srcDir || SRCDIR;
    this.dstDir = opts.dstDir || DSTDIR;
  }
  
  async convertMarkDownFile(fnSrc, fnDst, ) {
    const msg = 'HtmlFactory.convertMarkDownFile() ';
    let { renderer, categories, srcDir } = this;
    let markdown = fs.readFileSync(fnSrc).toString();
    let basePath = "/ebt-vue3/";
    let emd = new EbtMarkdown({basePath, wikiPath, renderer});
    let { metadata, htmlLines }  = await emd.render(markdown);

    //let cssPath = `${basePath}/wiki/ebt.css`;
    //htmlLines.unshift(`<link rel="stylesheet" href="${cssPath}">`);
    let html = htmlLines.join('\n');
    await fsp.writeFile(fnDst, html);

    let catKey = fnSrc.replace(srcDir, '');
    categories[catKey] = categories[catKey] || [];
    categories[catKey].push(metadata);

    logger.info(msg, catKey, fnDst);
  }

  async buildChannel(channel, srcDir) {
    const msg = 'HtmlFactory.buildChannel() ';
    const entries = await fsp.readdir(srcDir, {
      recursive: true,
      withFileTypes: true,
    });
    for (let i = 0; i < entries.length; i++) {
      let entry = entries[i];
      let { name, } = entry;
      let fnSrc = path.join(srcDir, name);
      let fnDst = fnSrc.replace(this.srcDir, this.dstDir);
      if (entry.isFile()) {
        if (name.endsWith('.md')) {
          fnDst = fnDst.replace(/.md$/, '.html');
          await this.convertMarkDownFile(fnSrc, fnDst);
          let item = { name, fnSrc, fnDst };
          channel.items.push(item);
          logger.info(msg, `Item ${channel.name}`, item);
        } else {
          logger.warn(msg, 'FILE ignored', {name, fnsSrc});
        }
      } else {
        logger.warn(msg, 'IGNORING ENTRY', {name, fnSrc});
      }
    }
  }

  async buildChannels(srcDir) {
    const msg = 'HtmlFactory.buildChannels() ';
    const entries = await fsp.readdir(srcDir, {
      recursive: true,
      withFileTypes: true,
    });
    for (let i = 0; i < entries.length; i++) {
      let entry = entries[i];
      let { name, } = entry;
      let fnSrc = path.join(srcDir, name);
      let fnDst = fnSrc.replace(this.srcDir, this.dstDir);
      if (entry.isDirectory()) {
        let channel = {name, fnSrc, fnDst, items:[]};
        logger.info(msg, 'DIR', channel);
        this.channels[name] = channel;
        await fsp.mkdir(fnDst, {recursive: true});
        await this.buildChannel(channel, fnSrc);
      } else {
        logger.warn(msg, 'IGNORING ENTRY', {name, fnSrc});
      }
    }
  }

  async build() {
    const msg = 'HtmlFactory.build() ';
    let { srcDir, dstDir } = this;
    await fsp.mkdir(dstDir, {recursive:true});
    this.categories = {};
    this.channels = {};
    try {
      await this.buildChannels(srcDir);
      logger.log(msg, "channels", this.channels);
    } catch(e) {
      logger.warn(msg, e);
    }
  }
}

let hf = new HtmlFactory();
hf.build();

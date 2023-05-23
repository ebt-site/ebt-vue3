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
    this.htmlHead = opts.htmlHead;
    this.htmlTail = opts.htmlTail;
  }
  
  async #convertMarkDownFile(fnSrc, fnDst, ) {
    const msg = 'HtmlFactory.convertMarkDownFile() ';
    let { renderer, categories, srcDir, htmlHead, htmlTail } = this;
    let markdown = fs.readFileSync(fnSrc).toString();
    let basePath = "/ebt-vue3/";
    let emd = new EbtMarkdown({basePath, wikiPath, renderer, htmlHead, htmlTail});
    let { metadata, htmlLines }  = await emd.render(markdown);

    //let cssPath = `${basePath}/wiki/ebt.css`;
    //htmlLines.unshift(`<link rel="stylesheet" href="${cssPath}">`);
    let html = htmlLines.join('\n');
    await fsp.writeFile(fnDst, html);

    let catKey = fnSrc.replace(srcDir, '');
    categories[catKey] = categories[catKey] || [];
    categories[catKey].push(metadata);

    logger.debug(msg, catKey, fnDst);
    return {
      metadata,
    }
  }

  async #buildChannelFiles(channel, srcDir) {
    const msg = 'HtmlFactory.buildChannelFiles() ';
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
          let { metadata }  = await this.#convertMarkDownFile(fnSrc, fnDst);
          let item = { name, fnSrc, fnDst, metadata };
          channel.items.push(item);
          logger.debug(msg, `Item ${channel.name}`, item);
        } else {
          logger.warn(msg, 'FILE ignored', {name, fnsSrc});
        }
      } else {
        logger.warn(msg, 'IGNORING CHANNEL ENTRY', {channel, name, fnSrc});
      }
    }
  }

  async #buildChannelIndex(channel) {
    const msg = 'HtmlFactory.buildChannelIndex() ';
    let { htmlHead, htmlTail } = this;
    let { name, items, fnDst } = channel;
    items.sort((a,b)=>EbtMarkdown.compareMetadata(a.metadata, b.metadata));
    let fnIndex = path.join(fnDst, 'index.html');
    let htmlLines;
    if (fs.existsSync(fnIndex)) {
      let htmlBuf = await fsp.readFile(fnIndex);
      htmlLines = htmlBuf.toString().split('\n');
      //console.log(msg, "index file", fnIndex, htmlLines);
    } else {
      let emd = new EbtMarkdown({htmlHead, htmlTail});
      htmlLines = [emd.htmlHead, emd.htmlTail];
      //console.log(msg, "no index file", fnIndex, htmlLines);
    }
    let curCategory = null;
    let htmlItems = items.reduce((a,item,i)=>{
      let { title, img, description, category="" } = item.metadata;
      if (curCategory !== category) {
        if (a.length) {
          a.push('</div>');
        }
        if (category) {
          a.push(`<div>`);
          a.push(` <h2>${category}</h2>`);
        } else {
          a.push('<div><hr />');
        }
      }
      a.push(` <div class="ebt-toc-item">`);
      a.push(`  <div class="ebt-thumbnail"><img src="${img}" /></div>`);
      a.push(`  <div class="ebt-toc-item-text">`);
      a.push(`   <div class="ebt-toc-item-title">${title}</div>`);
      a.push(`   <div class="ebt-toc-item-subtitle">${description}</div>`);
      a.push(`  </div>`);
      a.push(` </div>`);

      curCategory = category;
      return a;
    }, []);
    htmlItems.push('</div>');
    console.log(msg, htmlItems);
  }

  async #buildChannel({name, fnSrc}) {
    const msg = 'HtmlFactory.buildChannel() ';
    let fnDst = fnSrc.replace(this.srcDir, this.dstDir);
    let channel = {name, fnSrc, fnDst, items:[]};

    this.channels[name] = channel;
    await fsp.mkdir(fnDst, {recursive: true});
    await this.#buildChannelFiles(channel, fnSrc);
    await this.#buildChannelIndex(channel, fnSrc);

    return channel;
  }

  async #buildChannels(srcDir) {
    const msg = 'HtmlFactory.buildChannels() ';
    const entries = await fsp.readdir(srcDir, {
      recursive: true,
      withFileTypes: true,
    });
    for (let i = 0; i < entries.length; i++) {
      let entry = entries[i];
      let { name, } = entry;
      let fnSrc = path.join(srcDir, name);
      if (entry.isDirectory()) {
        let channel = await this.#buildChannel({ name, fnSrc });
        //console.log(msg, JSON.stringify(channel, null, 2));
      } else {
        logger.warn(msg, 'IGNORING CONTENT ENTRY', fnSrc);
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
      await this.#buildChannels(srcDir);
      logger.debug(msg, "channels", this.channels);
    } catch(e) {
      logger.warn(msg, e);
    }
  }
}

let hf = new HtmlFactory();
hf.build();

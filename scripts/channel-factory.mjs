import fs from 'fs';
const { promises: fsp } = fs;
import path from 'path';
import { logger } from 'log-instance';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { default as CmarkGfmRenderer } from './cmark-gfm-renderer.mjs';
import { default as EbtMarkdown } from '../src/ebt-markdown.mjs';
import { default as EbtCard } from '../src/ebt-card.mjs';
import { default as EbtConfig } from '../ebt-config.mjs';
const SRCDIR = path.join(__dirname, '../content');
const DSTDIR = path.join(__dirname, '../public/content');

export default class ChannelFactory {
  constructor(opts={}) {
    this.renderer = opts.renderer || new CmarkGfmRenderer();
    this.srcDir = opts.srcDir || SRCDIR;
    this.dstDir = opts.dstDir || DSTDIR;
    this.htmlHead = opts.htmlHead || '<article class="ebt-wiki">';
    this.htmlTail = opts.htmlTail || '</article>';
    this.wikiPath = opts.wikiPath || EbtConfig.homePath;
    this.config = opts.config || EbtConfig;
    this.indexSrcFile = `${this.config?.content?.index}.md`;
    this.basePath = opts.basePath || this.config.basePath;
  }
  
  async #convertMarkDownFile(fnSrc, fnDst, ) {
    const msg = 'ChannelFactory.convertMarkDownFile() ';
    let { config, renderer, categories, srcDir, htmlHead, htmlTail, basePath } = this;
    let markdown = fs.readFileSync(fnSrc).toString();
    let location = fnSrc
      .replace(srcDir,'')
      .replace(/\.md$/,'')
      .replace(/\.html$/,'')
      .split('/')
      .slice(1);
    let wikiPath = [ EbtCard.CONTEXT_WIKI, ...location, ].join('/');
    //console.log(msg, {srcDir, basePath, fnSrc, fnDst, wikiPath});
    let emd = new EbtMarkdown({
      config, basePath, wikiPath, renderer, htmlHead, htmlTail});
    let { metadata, htmlLines }  = await emd.render(markdown);

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

  async #buildChannelIndex(channel) {
    const msg = 'ChannelFactory.buildChannelIndex() ';
    let { htmlHead, htmlTail, config, indexSrcFile } = this;
    let { basePath, content } = config;
    let { name, kids, fnDst, fnSrc } = channel;
    kids.sort((a,b)=>EbtMarkdown.compareMetadata(a.metadata, b.metadata));
    let index = content.index;
    let indexDst = path.join(fnDst, `${index}.html`);
    //let indexSrcFile = `${index}.md`;
    let indexSrc = path.join(fnSrc, indexSrcFile);
    let htmlBody;
    if (fs.existsSync(indexSrc)) {
      let htmlBuf = await fsp.readFile(indexDst);
      htmlBody = htmlBuf.toString().split('\n');
      htmlHead && htmlBody.shift();
      htmlTail && htmlBody.pop();
    } else {
      let emd = new EbtMarkdown({config, htmlHead, htmlTail});
      htmlBody = [];
    }
    let htmlKids = kids.reduce((a,kid,i)=>{
      let { 
        title, 
        img, 
        detail=[], 
        description, 
        category="",
      } = kid.metadata;
      if (kid.name === indexSrcFile) {
        //console.log(msg, "skipping", kid);
        return a; // omit custom index file from index
      }
      let imgSrc = img.startsWith('http') 
        ? img.replace(' //', '//') 
        : `${basePath}img/${img}`
      let home = EbtCard.CONTEXT_WIKI;
      //console.log(msg, imgSrc);
      let tocHref = name === 'main'
      ? `${basePath}#/${home}/${kid.name}`.replace('.md', '')
      : `${basePath}#/${home}/${name}/${kid.name}`.replace('.md', '');
      a.push(`  <div class="ebt-toc-item">`);
      a.push(`   <a href="${tocHref}">`);
      a.push(`    <div class="ebt-thumbnail"><img src="${imgSrc}" /></div>`);
      a.push(`   </a>`);
      a.push(`   <div class="ebt-toc-item-text">`);
      a.push(`    <a href="${tocHref}">`);
      a.push(`      <div class="ebt-toc-item-title">${title}</div>`);
      a.push(`    </a>`);
      if (detail.length) {
        a.push(`     <details class="ebt-toc-detail" open>`);
        a.push(`       <summary class="ebt-toc-item-description">${description}</summary>`);
        a.push(`       <ul>`);
        detail.forEach(detail=>{
          a.push(`        <li>${detail}</li>`);
        });
        a.push(`       </ul>`);
        a.push(`     </details>`);
      } else {
        a.push(`     <div class="ebt-toc-item-description">${description}</div>`);
      }
      a.push(`    </div>`);
      a.push(`  </div><!--ebt-toc-item-->`);
      return a;
    }, []);
    htmlKids.unshift(` <div class="ebt-toc"><!--ebt-toc/${name}-->`);
    htmlKids.push(` </div><!--ebt-toc/${name}-->`);
    //console.log(msg, 'kids', kids.length, htmlKids.length);
    let html = [
      htmlHead,
      ...htmlBody,
      ...htmlKids, htmlTail,
    ].join('\n');
    await fsp.writeFile(indexDst, html);
    logger.info(msg, indexSrc, indexDst);
  }

  async #buildChannelFiles(channel, srcDir) {
    const msg = 'ChannelFactory.buildChannelFiles() ';
    let { indexSrcFile } = this;
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
          let kid = { name, fnSrc, fnDst, metadata };
          channel.kids.push(kid);
          logger.info(msg, `Channel ${channel.name}/${name}`);
        } else {
          logger.warn(msg, 'FILE ignored', {name, fnsSrc});
        }
      } else if (entry.isDirectory()) {
        let kid = { name, fnSrc, fnDst};
        let kidChannel = await this.#buildChannel(name, fnSrc);
        let kidIndex = kidChannel.kids.find(k => k.name === indexSrcFile);
        if (kidIndex) {
          kidIndex = Object.assign({}, kidIndex);
          kidIndex.name = `${name}/${kidIndex.name}`;
          channel.kids.push(kidIndex);
          logger.info(msg, `built channel ${channel.name}/${name}`, );
        } else {
          logger.info(msg, `built hidden channel ${channel.name}/${name}`);
        }
      } else {
        logger.warn(msg, 'IGNORING CHANNEL ENTRY', {channel, name, fnSrc});
      }
    }
  }

  async #buildChannel(name, fnSrc) {
    const msg = 'ChannelFactory.buildChannel() ';
    let fnDst = fnSrc.replace(this.srcDir, this.dstDir);
    let channel = {name, fnSrc, fnDst, kids:[]};

    await fsp.mkdir(fnDst, {recursive: true});
    await this.#buildChannelFiles(channel, fnSrc);
    await this.#buildChannelIndex(channel, fnSrc);

    return channel;
  }

  async build() {
    const msg = 'ChannelFactory.build() ';
    let { srcDir, dstDir } = this;
    await fsp.mkdir(dstDir, {recursive:true});
    this.categories = {};
    try {
      await this.#buildChannel('main', srcDir);
    } catch(e) {
      logger.warn(msg, e);
    }
  }
}

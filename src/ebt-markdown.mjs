import { default as EbtCard } from './ebt-card.mjs';

export default class EbtMarkdown {
  constructor(opts={}) {
    const msg = 'EbtMarkdown.ctor() ';

    let { 
      basePath='/ebt-vue3/',
      wikiPath=EbtCard.CONTEXT_HOME,
      renderer,
      htmlHead='<article class="ebt-wiki">',
      htmlTail='</article>',
    } = opts;
    Object.assign(this, {  
      basePath, wikiPath, renderer, htmlHead, htmlTail 
    });
  }

  static compareMetadata(a,b) {
    let acategory = a.category || '';
    let bcategory = b.category || '';
    let cmp = acategory.localeCompare(bcategory);
    if (cmp === 0) {
      let aorder = Number(a.order||0);
      let border = Number(b.order||0);
      cmp = aorder - border;
      if (cmp === 0) {
        let atitle = a.title || '';
        let btitle = b.title || '';
        cmp = atitle.localeCompare(btitle);
      }
    }
    return cmp;
  }

  async render(markdown, renderer=this.renderer) {
    const msg = 'EbtMarkdown.render() ';
    let { htmlHead, htmlTail } = this;
    if (!markdown) {
      throw new Error(`${msg} markdown is required`);
    }
    if (!renderer) {
      throw new Error(`${msg} renderer is required`);
    }
    let lines = markdown.split('\n');
    let md = markdown;
    let metadata;
    if (lines[0] === '---') {
      metadata = {};
      let iLine;
      for (iLine = 1; iLine < lines.length; iLine++) {
        let line = lines[iLine];
        if (line === '---') {
          lines = lines.splice(iLine+1);
          md = lines.join('\n');
          break;
        }
        let [key, ...valueParts] = line.split(/:[ \t]*/);
        let value = valueParts.join(': ');
        switch (key) {
          case 'img':
          case 'img-alt':
          case 'title': 
          case 'description':
            metadata[key] = value;
            break;
          case 'img-src':
            value = value.replace("https: //", "https://");
            metadata[key] = value;
            console.log(msg, key, value);
            break;
          default: 
            metadata[key] = value;
            break;
        }
      }
    }

    let html = await renderer.render(md);
    let htmlLines = html.trim().split('\n');
    
    let heading = this.htmlHeading(metadata);
    if (heading) {
      htmlLines = [...heading, ...htmlLines];
    }

    htmlLines =  [ htmlHead, ...htmlLines, htmlTail ];

    return {
      metadata,
      htmlLines,
    }
  }

  htmlHeading(metadata) {
    let { basePath, wikiPath, } = this;
    if (metadata == null) {
      return '';
    }
    let pathParts = wikiPath.split('/');
    if (pathParts[0] == '') {
      pathParts = pathParts.slice(1);
    }
    let spaces = '';
    let { 
      description,
      title="(no-title)", 
      img, 
      'img-alt':imgAlt,
      'img-src':imgSrc,
    } = metadata;
    let imgHtml = [];
    if (img) {
      imgHtml.push(` <a href="${imgSrc}"target="_blank">`);
      let src = `${basePath}img/${img}`;
      imgHtml.push(`  <img src="${src}" alt="${imgAlt}" title="${imgAlt}"/>`);
      imgHtml.push(' </a>');
    }

    // breadcrumbs
    let breadcrumbs = [];
    breadcrumbs.push('  <div class="ebt-wiki-breadcrumbs">');
    let iLast = pathParts.length-1;
    for (let i = 0; i < iLast; i++) {
      let part = pathParts[i];
      let href = [`${basePath}#`, ...pathParts.slice(0, i+1), 'index'].join('/');
      breadcrumbs.push(`   <a href="${href}" >${part}</a>&nbsp;&gt;&nbsp;`);
    }
    breadcrumbs.push(`   ${pathParts[iLast]}`);
    breadcrumbs.push('  </div><!--ebt-wiki-breadcrumbs-->');

    // text block
    let textHtml = [
      ' <div class="ebt-wiki-heading-text">',
      ...breadcrumbs,
      `  <h1>${title}</h1>`,
      `  <div class="ebt-wiki-description">${description}</div>`,
      ' </div><!--ebt-wiki-heading-text-->',
    ];

    return [
      '<div class="ebt-wiki-heading">',
      ...imgHtml,
      ...textHtml,
      '</div><!--ebt-wiki-heading-->',
    ];
  }

}



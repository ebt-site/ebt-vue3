import { default as MarkdownIt } from 'markdown-it';


export default class EbtMarkdown {
  constructor(markdown='', opts={}) {
    const msg = 'EbtMarkdown.ctor() ';
    let lines = markdown.split('\n');

    let { 
      basePath='basePath-undefined',
      wikiPath="wikiPath-undefined",
    } = opts;
    Object.assign(this, { basePath, wikiPath });

    if (lines[0] === '---') {
      this.heading = {};
      let iLine;
      for (iLine = 1; iLine < lines.length; iLine++) {
        let line = lines[iLine];
        if (line === '---') {
          lines = lines.splice(iLine+1);
          break;
        }
        let [key, ...valueParts] = line.split(/:[ \t]*/);
        let value = valueParts.join(': ');
        switch (key) {
          case 'img':
          case 'img-alt':
          case 'title': 
          case 'description':
            this.heading[key] = value;
            break;
          default: 
            this.heading[key] = value;
            break;
        }
      }
    }

    var mdit = new MarkdownIt();
    this.htmlLines = mdit.render(lines.join('\n')).trim().split('\n');
    let htmlHeading = this.htmlHeading();
    if (htmlHeading) {
      this.htmlLines = [...htmlHeading, ...this.htmlLines];
    }
  }

  htmlHeading() {
    let { basePath, wikiPath, heading, } = this;
    if (heading == null) {
      return '';
    }
    let pathParts = wikiPath.split('/');
    if (pathParts[0] == '') {
      pathParts = pathParts.slice(1);
    }
    let head = ['<div class="ebt-wiki-heading">'];
    let tail = ['</div><!--ebt-wiki-heading-->'];
    let spaces = '';
    let { 
      description,
      title, 
      img, 
      'img-alt':imgAlt,
    } = heading;
    if (img) {
      head.push('  <a target="_blank">');
      head.push(`    <img src="img/${img}" alt="${imgAlt}"/>`);
      head.push('  </a>');
    }
    head.push('  <div>');
    head.push('    <div class="text-caption">');
    let iLast = pathParts.length-1;
    for (let i = 0; i < iLast; i++) {
      let part = pathParts[i];
      let href = basePath + pathParts.slice(0, i+1).join('/');
      head.push(`      <a href="${href}" class="nuxt-link-active">`);
      head.push(`        ${part}`);
      head.push(`      </a>&nbsp;&gt;&nbsp;`);
    }
    head.push(`      ${pathParts[iLast]}`);
    head.push('    </div>');
    head.push('  </div>');
    return [...head, ...tail];
  }

}



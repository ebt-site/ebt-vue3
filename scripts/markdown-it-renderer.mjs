import { default as MarkdownIt} from 'markdown-it';
import { default as MarkdownItFootnote } from 'markdown-it-footnote';

export default class MarkdownItRenderer {
  constructor(opts={}) {
    this.md = MarkdownIt({
      html: true,               // Enable HTML tags in source
      xhtmlOut: false,          // Use '/' to close single tags (<br />).
                                // This is only for full CommonMark compatibility.
      breaks: false,            // Convert '\n' in paragraphs into <br>
      langPrefix: 'language-',  // CSS language prefix for fenced blocks. Can be
                                // useful for external highlighters.
      linkify: false,           // Autoconvert URL-like text to links
      wikiPath: '',
    }).use(MarkdownItFootnote);
    let { rules } = this.md.renderer;

    rules.footnote_anchor_name = (tokens, idx, options, env/*, slf*/) => {
      var n = Number(tokens[idx].meta.id + 1).toString();
      var prefix = 'fn';

      if (typeof env.docId === 'string') {
        prefix = '-' + env.docId + '-';
      }

      return this.footnoteId(prefix + n);
    }

    rules.footnote_block_open = (tokens, idx, options, env) => {
      const msg = "MarkdownItRenderer.footnote_block_open() ";
      let { footnotes } = this;
      let id = this.footnoteId();
      let sectionClass = footnotes ? "footnotes" : "footnotes footnotes-line";
      let html =  [
        `<section class="${sectionClass}">`,
        `<div id="${id}" class="footnotes-link">&nbsp;</div>`,
        footnotes ? `<div class="footnotes-title">${footnotes}</div>` : '',
        '<ol class="footnotes-list">',
        '',
      ].join('\n');
      //console.log(msg, html);
      return html;
    }

    rules.footnote_ref = (tokens, idx, options, env, slf) => {
      const msg = "MarkdownItRenderer.footnote_ref() ";
      var id      = this.footnoteId();
      var caption = slf.rules.footnote_caption(tokens, idx, options, env, slf);
      var refid   = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);

      if (tokens[idx].meta.subId > 0) {
        refid += ':' + tokens[idx].meta.subId;
      }

      let html = [
        '<sup class="footnote-ref">',
        //`<div id="${refid}" class="footnotes-link">&nbsp;</div>`,
        `<a href="#${id}">${caption}</a>`,
        '</sup>',
      ].join('');
      //console.log(msg, html);
      return html;
    }

    rules.footnote_anchor = (tokens, idx, options, env, slf) => {
      const msg = "MarkdownItRenderer.footnote_anchor() ";
      var id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);

      if (tokens[idx].meta.subId > 0) {
        id += ':' + tokens[idx].meta.subId;
      }

      // TODO: enable backref after solving scrolling into view
      /* ↩ with escape code to prevent display as Apple Emoji on iOS */
      //let html = ` <a href="#${id}" class="footnote-backref">\u21a9\uFE0E</a>`;

      let html = '';
      //console.log(msg, html);
      return html;
    }

    rules.footnote_open = (tokens, idx, options, env, slf) => {
      const msg = "MarkdownItRenderer.footnote_open() ";
      let html = '<li class="footnote-item">';
      //console.log(msg, html);
      return html;
    }
  }

  footnoteId(id='footnotes') {
    return `/${this.wikiPath}/-${id}`;
  }

  async render(markdown, opts={}) {
    let { md } = this;
    let { footnotes } = opts;
    this.wikiPath = opts.wikiPath;
    this.footnotes = footnotes;
    let html =  md.render(markdown, {});
    return html;
  }
}

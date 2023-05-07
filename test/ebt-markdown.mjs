import { default as EbtMarkdown } from '../src/ebt-markdown.mjs'
import { logger } from 'log-instance';
import should from "should";

logger.logLevel = 'warn';

(typeof describe === 'function') && describe("ebt-markdown.mjs", function () {
  it("default ctor", ()=>{
    let emd = new EbtMarkdown();
    should(emd).properties({htmlLines:['']});
    should.deepEqual(Object.keys(emd).sort(), [
      'htmlLines', 
      'wikiPath',
      'basePath',
    ].sort());
    should(emd).properties({
      wikiPath: 'wikiPath-undefined',
    });
  });
  it("TESTTESTheading", ()=>{
    let emd = new EbtMarkdown(`### Title\ntext`);
    should.deepEqual(emd.htmlLines, [
      '<h3>Title</h3>',
      '<p>text</p>',
    ]);
  });
  it("TESTTESTlink", ()=>{
    let emd = new EbtMarkdown('a [link](https://x/y) b');
    should.deepEqual(emd.htmlLines, [
      '<p>a <a href="https://x/y">link</a> b</p>',
    ]);
  });
  it("TESTTESTheading", ()=>{
    let md = [
      '---',
      'title: test-title',
      'img: test-img',
      'img-alt: test-img-alt',
      'unknown-key: test-unknown',
      '---',
      'test-body',
      '',
    ].join('\n');
    let basePath = '/test-basePath/';
    let wikiBase = 'test-wikiPath';
    let wikiPath = `${wikiBase}/a/b`;
    let emd = new EbtMarkdown(md, {basePath, wikiPath});
    should(emd).properties({
      heading: {
        title: 'test-title',
        img: 'test-img',
        'img-alt': 'test-img-alt',
        'unknown-key': 'test-unknown',
      },
    });
    let delimiter = '&nbsp;&gt;&nbsp;';
    should.deepEqual(emd.htmlLines, [
      '<div class="ebt-wiki-heading">',
      '  <a target="_blank">',
      '    <img src="img/test-img" alt="test-img-alt"/>',
      '  </a>',
      '  <div>',
      '    <div class="text-caption">',
      `      <a href="${basePath}${wikiBase}" class="nuxt-link-active">`,
      '        test-wikiPath',
      `      </a>${delimiter}`,
      `      <a href="${basePath}${wikiBase}/a" class="nuxt-link-active">`,
      '        a',
      `      </a>${delimiter}`,
      '      b',
      '    </div>',
      '  </div>',
      '</div><!--ebt-wiki-heading-->',
      '<p>test-body</p>',
    ]);
  });
});

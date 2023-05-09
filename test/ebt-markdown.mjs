import { default as EbtMarkdown } from '../src/ebt-markdown.mjs'
import { default as CmarkGfmRenderer } from '../scripts/cmark-gfm-renderer.mjs';
import { logger } from 'log-instance';
import should from "should";

logger.logLevel = 'warn';

const renderer = new CmarkGfmRenderer();

(typeof describe === 'function') && describe("ebt-markdown.mjs", function () {
  it("TESTTESTdefault ctor", ()=>{
    let emd = new EbtMarkdown();
    should.deepEqual(Object.keys(emd).sort(), [
      'wikiPath',
      'basePath',
      'renderer',
    ].sort());
    should(emd).properties({
      basePath: '/ebt-vue3/',
      wikiPath: 'wiki',
      renderer: undefined,
    });
  });
  it("TESTTESTheading", async ()=>{
    let markdown = '### Title\ntext';
    let emd = new EbtMarkdown({renderer});
    let htmlLines = await emd.render(markdown);
    should.deepEqual(htmlLines, [
      '<h3>Title</h3>',
      '<p>text</p>',
    ]);
  });
  it("TESTTESTlink", async ()=>{
    let markdown = [
      'a [link](https://x/y) b',
      '<a href="https://p/q">pq</a> c',
    ].join('\n');
    let emd = new EbtMarkdown({renderer});
    let htmlLines = await emd.render(markdown);
    should.deepEqual(htmlLines, [
      '<p>a <a href="https://x/y">link</a> b',
      '<a href="https://p/q">pq</a> c</p>',
    ]);
  });
  it("TESTTESTtable", async ()=>{
    let markdown = [
      'a table ',
      '| title1 | title2 |',
      '| ---- | ---- |',
      '| cell1 | cell2 |',
    ].join('\n');
    let emd = new EbtMarkdown({renderer});
    let htmlLines = await emd.render(markdown);
    should.deepEqual(htmlLines, [
      '<p>a table</p>',
      '<table>',
      '<thead>',
      '<tr>',
      '<th>title1</th>',
      '<th>title2</th>',
      '</tr>',
      '</thead>',
      '<tbody>',
      '<tr>',
      '<td>cell1</td>',
      '<td>cell2</td>',
      '</tr>',
      '</tbody>',
      '</table>',
    ]);
  });
  it("TESTTESTheading", async ()=>{
    let markdown = [
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
    let emd = new EbtMarkdown({basePath, wikiPath, renderer});
    let delimiter = '&nbsp;&gt;&nbsp;';
    let htmlLines = await emd.render(markdown);
    let heading = emd.parseHeading(markdown);
    should(emd.heading).properties({
      title: 'test-title',
      img: 'test-img',
      'img-alt': 'test-img-alt',
      'unknown-key': 'test-unknown',
    });
    let src = `${basePath}img/test-img`;
    should.deepEqual(htmlLines, [
      '<div class="ebt-wiki-heading">',
      '  <a target="_blank">',
      `    <img src="${src}" alt="test-img-alt" title="test-img-alt"/>`,
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

import { default as EbtMarkdown } from '../src/ebt-markdown.mjs'
import { default as CmarkGfmRenderer } from '../scripts/cmark-gfm-renderer.mjs';
import { logger } from 'log-instance/index.mjs';
import should from "should";

logger.logLevel = 'warn';

const renderer = new CmarkGfmRenderer();

(typeof describe === 'function') && describe("ebt-markdown.mjs", function () {
  it("default ctor", ()=>{
    let emd = new EbtMarkdown();
    should.deepEqual(Object.keys(emd).sort(), [
      'appName',
      'wikiPath',
      'config',
      'basePath',
      'renderer',
      'htmlHead',
      'htmlTail',
    ].sort());
    should(emd).properties({
      basePath: '/ebt-vue3/',
      wikiPath: 'wiki',
      renderer: undefined,
    });
  });
  it("custom ctor", ()=>{
    const appName = 'test-appName';
    const config = {
      basePath: 'test-basepath',
      appName,
    };
    let emd = new EbtMarkdown({config});
    should(emd).properties({
      basePath: config.basePath,
      appName,
      config,
      wikiPath: 'wiki',
      renderer: undefined,
    });

    let emd2 = new EbtMarkdown({config, appName:'test-appNameOverride'});
    should(emd2).properties({
      basePath: config.basePath,
      appName: 'test-appNameOverride',
      config,
      wikiPath: 'wiki',
      renderer: undefined,
    });
  });
  it("heading", async ()=>{
    let markdown = '### Title ${appName}\ntext';
    let appName = 'TEST-APPNAME';
    let emd = new EbtMarkdown({renderer, appName});
    let { htmlLines } = await emd.render(markdown);
    should.deepEqual(htmlLines, [
      EbtMarkdown.HTML_HEAD,
      `<h3>Title ${appName}</h3>`,
      '<p>text</p>',
      '</article>',
    ]);
    should(emd.metadata).equal(undefined);
  });
  it("TESTTESTlink", async ()=>{
    let markdown = [
      'a [link](https://x/y) external',
      '<a href="https://p/q">pq</a> external',
      'a [link](/z1) internal',
      '<a href="z2">pq</a> internal',
    ].join('\n');
    let emd = new EbtMarkdown({renderer});
    let { htmlLines } = await emd.render(markdown);
    should.deepEqual(htmlLines, [
      EbtMarkdown.HTML_HEAD,
      '<p>a <a href="https://x/y" target="_blank">link</a> external',
      '<a href="https://p/q" target="_blank">pq</a> external',
      'a <a href="/z1">link</a> internal',
      '<a href="z2">pq</a> internal</p>',
      '</article>',
    ]);
  });
  it("table", async ()=>{
    let markdown = [
      'a table ',
      '| title1 | title2 |',
      '| ---- | ---- |',
      '| cell1 | cell2 |',
    ].join('\n');
    let emd = new EbtMarkdown({renderer});
    let { htmlLines } = await emd.render(markdown);
    should.deepEqual(htmlLines, [
      EbtMarkdown.HTML_HEAD,
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
      '</article>',
    ]);
  });
  it("TESTTESThtml heading", async ()=>{
    let appName = "TEST_APPNAME";
    let imgSrc = "test-img-src";
    let markdown = [
      '---',
      'title: test-title',
      'img: test-img',
      'img-alt: test-img-alt',
      `img-src: ${imgSrc}`,
      'link: test-img-link',
      'unknown-key: test-unknown',
      'description: test-description ${appName}',
      'category: test-category',
      '---',
      'test-body',
      '',
    ].join('\n');
    let basePath = '/test-basePath/';
    let wikiBase = 'test-wikiPath';
    let wikiPath = `${wikiBase}/a/b`;
    let emd = new EbtMarkdown({basePath, wikiPath, renderer, appName});
    let delimiter = '&nbsp;&gt;&nbsp;';
    let { metadata, htmlLines } = await emd.render(markdown);
    let heading = emd.htmlHeading(markdown);
    should(metadata).properties({
      title: 'test-title',
      img: 'test-img',
      'img-alt': 'test-img-alt',
      'unknown-key': 'test-unknown',
      category: 'test-category',
    });
    let src = `${basePath}img/test-img`;
    should.deepEqual(htmlLines, [
      EbtMarkdown.HTML_HEAD,
      '<div class="ebt-wiki-heading">',
      ` <a href="${imgSrc}" target="_blank">`,
      `  <img src="${src}" alt="test-img-alt" title="test-img-alt"/>`,
      ' </a>',
      ' <div class="ebt-wiki-heading-text">',
      '  <div class="ebt-wiki-breadcrumbs">',
      `   <a href="${basePath}#/${wikiBase}/toc" >test-wikiPath</a>${delimiter}`,
      `   <a href="${basePath}#/${wikiBase}/a/toc" >a</a>${delimiter}`,
      '   b',
      '  </div><!--ebt-wiki-breadcrumbs-->',
      '  <h1>test-title</h1>',
      `  <div class="ebt-wiki-description">test-description ${appName}</div>`,
      ' </div><!--ebt-wiki-heading-text-->',
      '</div><!--ebt-wiki-heading-->',
      '<p>test-body</p>',
      EbtMarkdown.HTML_TAIL,
    ]);
  });
  it("TESTTESThtml heading optional", async ()=>{
    let appName = "TEST_APPNAME";
    let imgSrc = "test-img-src";
    let markdown = [
      '---',
      'title: test-title',
      'img: test-img',
      'img-alt: test-img-alt',
      `img-src: ${imgSrc}`,
      'link: test-img-link',
      'unknown-key: test-unknown',
      'description: test-description ${appName}',
      'detail: test-detail-1',
      'detail: test-detail-2',
      'category: test-category',
      'order: 42',
      '---',
      'test-body',
      '',
    ].join('\n');
    let basePath = '/test-basePath/';
    let wikiBase = 'test-wikiPath';
    let wikiPath = `${wikiBase}/a/b`;
    let emd = new EbtMarkdown({basePath, wikiPath, renderer, appName});
    let delimiter = '&nbsp;&gt;&nbsp;';
    let { metadata, htmlLines } = await emd.render(markdown);
    let heading = emd.htmlHeading(markdown);
    should(metadata).properties({
      title: 'test-title',
      img: 'test-img',
      'img-alt': 'test-img-alt',
      'unknown-key': 'test-unknown',
      order: '42',
      category: 'test-category',
    });
    let src = `${basePath}img/test-img`;
    should.deepEqual(htmlLines, [
      EbtMarkdown.HTML_HEAD,
      '<div class="ebt-wiki-heading">',
      ` <a href="${imgSrc}" target="_blank">`,
      `  <img src="${src}" alt="test-img-alt" title="test-img-alt"/>`,
      ' </a>',
      ' <div class="ebt-wiki-heading-text">',
      '  <div class="ebt-wiki-breadcrumbs">',
      `   <a href="${basePath}#/${wikiBase}/toc" >test-wikiPath</a>${delimiter}`,
      `   <a href="${basePath}#/${wikiBase}/a/toc" >a</a>${delimiter}`,
      '   b',
      '  </div><!--ebt-wiki-breadcrumbs-->',
      '  <h1>test-title</h1>',
      `  <div class="ebt-wiki-description">test-description ${appName}</div>`,
      `  <ul>`,
      `   <li>test-detail-1</li>`,
      `   <li>test-detail-2</li>`,
      `  </ul>`,
      ' </div><!--ebt-wiki-heading-text-->',
      '</div><!--ebt-wiki-heading-->',
      '<p>test-body</p>',
      EbtMarkdown.HTML_TAIL,
    ]);
  });
  it("compareMetadata()", ()=>{
    // single level
    should(EbtMarkdown.compareMetadata({ order: 1, },{ order: 2, })).below(0);
    should(EbtMarkdown.compareMetadata({ order: 2, },{ order: 1, })).above(0);
    should(EbtMarkdown.compareMetadata({ title: 't1' },{ title: 't2' })).below(0);
    should(EbtMarkdown.compareMetadata({ title: 't2' },{ title: 't1' })).above(0);
    should(EbtMarkdown.compareMetadata({ category: 'c1' },{ category: 'c2' })).below(0);
    should(EbtMarkdown.compareMetadata({ category: 'c2' },{ category: 'c1' })).above(0);

    // multilevel: category > order > title
    let t1o1 = { title: 't1', order: 1 };
    let t2o1 = { title: 't2', order: 1 };
    let t1o2 = { title: 't1', order: 2 };
    let t2o2 = { title: 't2', order: 2 };
    let c1o1 = { category: 'c1', order: 1 };
    let c1o2 = { category: 'c1', order: 2 };
    let c2o1 = { category: 'c2', order: 1 };
    let c1t1 = { category: 'c1', title: 't1' };
    let c1t2 = { category: 'c1', title: 't2' };
    let c2t1 = { category: 'c2', title: 't1' };
    should(EbtMarkdown.compareMetadata(t1o1, t1o1)).equal(0);
    should(EbtMarkdown.compareMetadata(t1o1, t1o2)).below(0);
    should(EbtMarkdown.compareMetadata(t1o1, t2o2)).below(0);
    should(EbtMarkdown.compareMetadata(t2o1, t2o1)).equal(0);
    should(EbtMarkdown.compareMetadata(t2o1, t1o2)).below(0);
    should(EbtMarkdown.compareMetadata(t2o1, t1o1)).above(0);
    should(EbtMarkdown.compareMetadata(c2t1, c2t1)).equal(0);
    should(EbtMarkdown.compareMetadata(c1t1, c1t2)).below(0);
    should(EbtMarkdown.compareMetadata(c2t1, c1t2)).above(0);
    should(EbtMarkdown.compareMetadata(c2t1, c1t1)).above(0);
  });
});

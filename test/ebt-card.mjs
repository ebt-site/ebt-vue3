import { default as EbtCard } from "../src/ebt-card.mjs";
import { logger } from "log-instance";
import should from "should";

logger.logLevel = 'warn';

(typeof describe === 'function') && describe("ebt-card.mjs", function () {
  it("TESTTESTdefault ctor", async () => {
    let card1 = new EbtCard();
    let card2 = new EbtCard();
    let defaultProps = {
      context: EbtCard.CONTEXT_HOME,
      location: [],
      isOpen: true,
      data: undefined,
    }
    should(card1.id.length).equal(12);
    should(card1.tab1Id.length).equal(17);
    should(card1.autofocusId.length).equal(22);
    should(card1).properties(defaultProps);

    should(card2.id).not.equal(card1.id);
    should(card2.autofocusId).not.equal(card1.autofocusId);
    should(card2.tab1Id).not.equal(card1.tab1Id);
    should(card2).properties(defaultProps);
  });
  it("constants", ()=>{
    should(EbtCard.CONTEXT_DEBUG).equal('debug');
    should(EbtCard.CONTEXT_HOME).equal('home');
    should(EbtCard.CONTEXT_SEARCH).equal('search');
    should(EbtCard.CONTEXT_SUTTA).equal('sutta');
    should(EbtCard.CONTEXT_WIKI).equal('wiki');
  });
  it("custom ctor", async () => {
    let id = 'test-id';
    let context = 'search';
    let location = 'test-location';
    let data = "test-data";
    let langTrans = "test-lang";
    let card1 = new EbtCard({id, context, location, data, langTrans});
    should(card1).properties({id, context, location: [location,langTrans], data});
    let card2 = new EbtCard(Object.assign({}, card1));
    should(card2).properties(card1);
  });
  it("icon", async() => {
    let card = new EbtCard();
    should(card.icon).equal("mdi-home");
    let cardWiki = new EbtCard({ context: "wiki"});
    should(cardWiki.icon).equal("mdi-wikipedia");
  });
  it("stringify", async() => {
    let card1 = new EbtCard();
    let json = JSON.stringify(card1);
    let card2 = new EbtCard(JSON.parse(json));
    should(card2).properties(card1);
  });
  it("matchPath() wiki context", async() => {
    let card0 = new EbtCard({ context: "" });
    let card1 = new EbtCard({ context: "wiki", });
    let card2 = new EbtCard({ context: "wiki", location:["a","b c"], });

    let noPaths = [
      "/search/a",
      "#/search/a",
      "/wiki/a",
      "#/wiki/a",
      "/wiki/a/c",
    ];
    noPaths.forEach(path=>{
      should(card0.matchPath(path)).equal(false);
      should(card1.matchPath(path)).equal(false);
      should(card2.matchPath(path)).equal(false);
    });

    let card0Paths = [
      "/",
    ];
    card0Paths.forEach(path => {
      should(card0.matchPath(path)).equal(true);
      should(card1.matchPath(path)).equal(false);
      should(card2.matchPath(path)).equal(false);
    });

    let card1Paths = [
      "/wiki",
      "#/wiki",
      "/wiki/",
      "#/wiki/",
      "/WIKI",
      "#/WIKI",
      "/WIKI/",
      "#/WIKI/",
      "/WIKI//",
    ];
    card1Paths.forEach(path=>{
      should(card0.matchPath(path)).equal(false);
      should(card1.matchPath(path)).equal(true);
      should(card2.matchPath(path)).equal(false);
    });

    let card2Paths = [
      "/wiki/a/b%20c",
      "#/wiki/a/b%20c",
      "/wiki/a/b%20c/",
      "#/wiki/a/b%20c/",
      "/WIKI/A/B%20C",
      "#/WIKI/A/B%20C",
      "/WIKI/A/B%20C/",
      "#/WIKI/A/B%20C/",
    ];
    card2Paths.forEach(path=>{
      should(card0.matchPath(path)).equal(false);
      should(card1.matchPath(path)).equal(false);
      should(card2.matchPath(path)).equal(true);
    });
  });
  it("matchPath() search context", async() => {
    let langTrans = 'test-lang';
    let card0 = new EbtCard({ context: "" , langTrans});
    let card1 = new EbtCard({ context: "search", langTrans});
    let card2 = new EbtCard({ context: "SEARCH", location: ["a b"], langTrans});

    let noPaths = [
      "/search/nothing",
      "#/search/nothing",
      "/wiki",
      "search",
      "search/a",
      `search/x/${langTrans}`,
    ];
    noPaths.forEach(path=>{
      should(card0.matchPath(path)).equal(false);
      should(card1.matchPath(path)).equal(false);
      should(card2.matchPath(path)).equal(false);
    });

    let card0Paths = [
      "/",
      "#/",
    ];
    card0Paths.forEach(path => {
      should(card0.matchPath(path)).equal(true);
      should(card1.matchPath(path)).equal(false);
      should(card2.matchPath(path)).equal(false);
    });

    let card1Paths = [
      {path: '/search//', defaultLang: langTrans},
      {path: '#/search//', defaultLang: langTrans},
      `/search//${langTrans}`,
      `#/search//${langTrans}`,
    ];
    card1Paths.forEach(path=>{
      should(card0.matchPath(path)).equal(false);
      should(card1.matchPath(path)).equal(true);
      should(card2.matchPath(path)).equal(false);
    });

    let card2Paths = [
      `/search/a%20b/${langTrans}`,
      `#/search/a%20b/${langTrans}/`,
      `/SEARCH/A%20B/${langTrans.toUpperCase()}`,
      `#/SEARCH/A%20B/${langTrans.toUpperCase()}/`,
    ];
    card2Paths.forEach(path=>{
      should(card0.matchPath(path)).equal(false);
      should(card1.matchPath(path)).equal(false);
      should(card2.matchPath(path)).equal(true);
    });
  });
  it("matchPath() sutta context", async() => {
    let locSutta = "sn35.1";
    let locSegA = `${locSutta}:1.10`;
    let locSegB = `${locSutta}:2.3`;
    let langTrans = 'de';
    let context = 'sutta';
    let author = 'sabbamitta';
    let notSutta = "thig1.1";
    let notLang = 'en';
    let notAuthor = 'sujato';

    // create fully specified cards
    let cardSutta = new EbtCard({ context, location: [locSutta, langTrans, author]});
    let cardSegA = new EbtCard({ context, location: [locSegA, langTrans, author]});
    let cardSegB = new EbtCard({ context, location: [locSegB, langTrans, author]});

    let dbg = 0;
    if (dbg) {
      //let path = `/sutta/${locSutta}`;
      //should(cardSegA.matchPath(path)).equal(false);
    }

    // not matches
    let noPaths = [
      `sutta/thig1.1`,
      `/wiki`,
      `/search/${locSutta}`,
      `/search/${locSutta}/${langTrans}`,
      `/search/${locSutta}/${langTrans}/${author}`,

      `/sutta/${notSutta}`, 
      `/sutta/${notSutta}/${langTrans}`,
      `/sutta/${notSutta}/${langTrans}/${author}`,
      `/sutta/${locSutta}`, // defaultLang is pli
      `/sutta/${locSegA}`, // defaultLang is pli
      `/sutta/${locSegB}`, // defaultLang is pli
      `/sutta/${locSutta}/${notLang}`,
      `/sutta/${locSutta}/${notLang}/${notAuthor}`,
      `/sutta/${locSutta}/${notLang}/${author}`,
      `/sutta/${locSutta}/${langTrans}/${notAuthor}`,
      `/sutta/${locSegA}/${notLang}`,
      `/sutta/${locSegA}/${notLang}/${notAuthor}`,
      `/sutta/${locSegA}/${notLang}/${author}`,
      `/sutta/${locSegA}/${langTrans}/${notAuthor}`,
      `sutta/mn1`,
      `/sutta`,
    ];
    noPaths.forEach(path=>{
      should(cardSutta.matchPath(path)).equal(false);
      should(cardSegA.matchPath(path)).equal(false);
      should(cardSegB.matchPath(path)).equal(false);
    });

    // match without segment number
    let suttaPaths = [
      { path: `/sutta/${locSutta}`, defaultLang: langTrans },
      { path: `#/sutta/${locSutta}`, defaultLang: langTrans },
      `/sutta/${locSutta}/${langTrans}`,
      `#/sutta/${locSutta}/${langTrans}`,
      `/sutta/${locSutta}/${langTrans}/${author}`,
      `#/sutta/${locSutta}/${langTrans}/${author}`,
    ];
    suttaPaths.forEach(path => {
      should(cardSutta.matchPath(path)).equal(true);
      should(cardSegA.matchPath(path)).equal(true);
      should(cardSegB.matchPath(path)).equal(true);
    });

    // match with segment number
    let segPaths = [
      { path: `#/sutta/${locSegA}`, defaultLang: langTrans},
      { path: `/sutta/${locSegA}`, defaultLang: langTrans},
      { path: `/sutta/${locSegB}`, defaultLang: langTrans},
      `/sutta/${locSegA}/${langTrans}`,
      `#/sutta/${locSegA}/${langTrans}`,
      `/sutta/${locSegA}/${langTrans}/${author}`,
      `#/sutta/${locSegA}/${langTrans}/${author}`,
    ];
    segPaths.forEach(path => {
      should(cardSutta.matchPath(path)).equal(true);
      should(cardSegA.matchPath(path)).equal(true);
      should(cardSegB.matchPath(path)).equal(true);
    });
  });
  it("pathToCard() search", ()=>{
    let cards = [];
    let nAdd = 0;
    let langTrans = "test-lang";
    let addCard = (opts) => {
      let card = new EbtCard(Object.assign({langTrans},opts));
      //console.trace(`added card`, card);
      cards.push(card);
      nAdd++
      return card;
    }
    let cardHome = EbtCard.pathToCard({path:'/', cards, addCard});
    should.deepEqual(cards, [cardHome]);
    let cardHome2 = EbtCard.pathToCard({path:'/', cards, addCard});
    should.deepEqual(cards, [cardHome]);

    let cardSearch = EbtCard.pathToCard({path:'/search', cards, addCard});
    should.deepEqual(cards, [cardHome, cardSearch]);
    let cardSearch2 = EbtCard.pathToCard({path:'/search', cards, addCard});
    should.deepEqual(cards, [cardHome, cardSearch]);

    let cardSearchAB = EbtCard.pathToCard({path:'/search/a%20b', cards, addCard});
    should.deepEqual(cards, [cardHome, cardSearch, cardSearchAB]);
    let cardSearchAB2 = EbtCard.pathToCard({path:'/search/a%20b', cards, addCard});
    should.deepEqual(cards, [cardHome, cardSearch, cardSearchAB]);

    let cardSearchABC = EbtCard.pathToCard({path:'/search/a%20b/c', cards, addCard});
    should.deepEqual(cards, [cardHome, cardSearch, cardSearchAB, cardSearchABC]);
    let cardSearchAB3 = EbtCard.pathToCard({path:'/search/a%20b/c', cards, addCard});
    should.deepEqual(cards, [cardHome, cardSearch, cardSearchAB, cardSearchABC]);
    let cardSearchABC2 = EbtCard.pathToCard({path:'/search/a%20b/c', cards, addCard});
    should.deepEqual(cards, [cardHome, cardSearch, cardSearchAB, cardSearchABC]);

    should(nAdd).equal(4);
  });
  it("pathToCard() sutta", ()=>{
    let cards = [];
    let nAdd = 0;
    let langTrans = "test-lang";
    let defaultLang = langTrans;
    let author = "test-author";
    let addCard = (opts) => {
      let card = new EbtCard(Object.assign({langTrans, author},opts));
      //console.trace(`added card`, card);
      cards.push(card);
      nAdd++
      return card;
    }
    let cardSN42_11 = EbtCard.pathToCard({
      path:'/sutta/sn42.11', cards, addCard, defaultLang});
    should.deepEqual(cards, [cardSN42_11]);
    let cardSN42_11$2 = EbtCard.pathToCard({
      path:'/sutta/sn42.11', cards, addCard, defaultLang});
    should.deepEqual(cards, [cardSN42_11]);

    let cardSN42_11_1_10 = EbtCard.pathToCard({
      path:'/sutta/sn42.11:1.10', cards, addCard, defaultLang});
    should.deepEqual(cards, [cardSN42_11]);

    should(nAdd).equal(1);
  });
  it("routeHash() sutta", ()=>{
    let context = 'sutta';
    let suid = 'sn34.1';
    let suidSeg = `${suid}:2.3`;
    let suidSeg2 = `${suid}:4.1`;
    let langTrans = "de";
    let author = "sabbamitta";
    let cardSuid = new EbtCard({context, location:[suid, langTrans, author]});
    let cardSuidSeg = new EbtCard({context, location:[suidSeg, langTrans, author]});

    // no arguments uses existing card location
    should(cardSuid.routeHash()).equal(`#/${context}/${suid}/${langTrans}/${author}`);
    should(cardSuidSeg.routeHash()).equal(`#/${context}/${suidSeg}/${langTrans}/${author}`);

    // update location segment id
    should(cardSuid.routeHash(`/${context}/${suidSeg2}`))
      .equal(`#/${context}/${suidSeg2}/${langTrans}/${author}`);
    should.deepEqual(cardSuid.location, [suidSeg2, langTrans, author]);
    should(cardSuidSeg.routeHash(`/${context}/${suidSeg2}`))
      .equal(`#/${context}/${suidSeg2}/${langTrans}/${author}`);
    should.deepEqual(cardSuidSeg.location, [suidSeg2, langTrans, author]);
    
    // remove segment id
    should(cardSuidSeg.routeHash(`/${context}/${suid}`))
      .equal(`#/${context}/${suid}/${langTrans}/${author}`);
    should.deepEqual(cardSuidSeg.location, [suid, langTrans, author]);
  });
  it('incrementLocation() sutta', ()=>{
    let context = 'sutta';
    let suid = 'sn34.1';
    let scids = [ '1.0', '1.1', '2.1'].map(id=>`${suid}:${id}`);
    let segments = scids.map(scid => ({scid}));
    let langTrans = "de";
    let author = "sabbamitta";
    let location = [ segments[0].scid, langTrans, author ];
    let card = new EbtCard({context, location});

    // forward
    should.deepEqual(card.location, [ scids[0], langTrans, author, ]);
    should.deepEqual(card.incrementLocation({segments, delta:1}), {
      location: [ scids[1], langTrans, author, ],
      iSegment: 1,
    });
    should.deepEqual(card.location, [ scids[1], langTrans, author, ]);
    should.deepEqual(card.incrementLocation({segments}), {
      location: [ scids[2], langTrans, author, ],
      iSegment: 2,
    });
    should.deepEqual(card.incrementLocation({segments}), null);
    should.deepEqual(card.location, [ scids[2], langTrans, author, ]);

    // backward
    should.deepEqual(card.incrementLocation({segments, delta:-1}), {
      location: [ scids[1], langTrans, author, ],
      iSegment: 1,
    });
    should.deepEqual(card.location, [ scids[1], langTrans, author, ]);
    should.deepEqual(card.incrementLocation({segments, delta:-1}), {
      location: [ scids[0], langTrans, author, ],
      iSegment: 0,
    });
    should.deepEqual(card.location, [ scids[0], langTrans, author, ]);
    should.deepEqual(card.incrementLocation({segments, delta:-1}), null);
    should.deepEqual(card.location, [ scids[0], langTrans, author, ]);
  });
  it('incrementLocation() ranged sutta', ()=>{
    let context = 'sutta';
    let suid = 'sn34.1';
    let scids = [ 
      'dhp1:1.0', 
      'dhp1:1.1', 
      'dhp2:1.0', 
      'dhp2:1.1', 
    ];
    let segments = scids.map(scid => ({scid}));
    let langTrans = "en";
    let author = "sujato";
    let location = [ segments[0].scid, langTrans, author ];
    let card = new EbtCard({context, location});

    // forward
    should.deepEqual(card.location, [ scids[0], langTrans, author, ]);
    should.deepEqual(card.incrementLocation({segments, delta:1}), {
      location: [ scids[1], langTrans, author, ],
      iSegment: 1,
    });
    should.deepEqual(card.location, [ scids[1], langTrans, author, ]);
    should.deepEqual(card.incrementLocation({segments}), {
      location: [ scids[2], langTrans, author, ],
      iSegment: 2,
    });
    should.deepEqual(card.location, [ scids[2], langTrans, author, ]);
    should.deepEqual(card.incrementLocation({segments}), {
      location: [ scids[3], langTrans, author, ],
      iSegment: 3,
    });
    should.deepEqual(card.incrementLocation({segments}), null);
    should.deepEqual(card.location, [ scids[3], langTrans, author, ]);

    // backward
    should.deepEqual(card.incrementLocation({segments, delta:-1}), {
      location: [ scids[2], langTrans, author, ],
      iSegment: 2,
    });
    should.deepEqual(card.incrementLocation({segments, delta:-1}), {
      location: [ scids[1], langTrans, author, ],
      iSegment: 1,
    });
    should.deepEqual(card.location, [ scids[1], langTrans, author, ]);
    should.deepEqual(card.incrementLocation({segments, delta:-1}), {
      location: [ scids[0], langTrans, author, ],
      iSegment: 0,
    });
    should.deepEqual(card.location, [ scids[0], langTrans, author, ]);
    should.deepEqual(card.incrementLocation({segments, delta:-1}), null);
    should.deepEqual(card.location, [ scids[0], langTrans, author, ]);
  });
  it("TESTTESTfocus()", ()=>{
    let card = new EbtCard();
    let { tab1Id, autofocusId } = card;
    let elts = [];
    let document = {
      activeElement: undefined,
      getElementById: (id)=>{ return elts.find(elt=>elt.id === id); },
    };
    let testElt1 = { id:tab1Id, focus:()=>{document.activeElement = testElt1;}};
    let testElt2 = { id:autofocusId, focus:()=>{document.activeElement = testElt2;}};
    global.document = document;

    // No element
    should(card.focus()).equal(undefined);
    should(document.activeElement).equal(undefined);

    // tab1 element but no autofocus element
    elts.push(testElt1);
    should(card.focus()).equal(testElt1);
    should(document.activeElement).equal(testElt1);

    // both autofocus and tab1 elements
    elts.push(testElt2);
    should(card.focus()).equal(testElt2);
    should(document.activeElement).equal(testElt2);
  });
});

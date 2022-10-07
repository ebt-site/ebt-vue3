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
    should(card1.id.length).equal(36);
    should(card1).properties(defaultProps);

    should(card2.id).not.equal(card1.id);
    should(card2).properties(defaultProps);
  });
  it("TESTTESTconstants", ()=>{
    should(EbtCard.CONTEXT_SEARCH).equal('search');
  });
  it("TESTTESTcustom ctor", async () => {
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
  it("TESTTESTicon", async() => {
    let card = new EbtCard();
    should(card.icon).equal("mdi-home");
    let cardWiki = new EbtCard({ context: "wiki"});
    should(cardWiki.icon).equal("mdi-wikipedia");
  });
  it("TESTTESTstringify", async() => {
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
      "/wiki/a",
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
      "/wiki/",
      "/WIKI",
      "/WIKI/",
      "/WIKI//",
    ];
    card1Paths.forEach(path=>{
      should(card0.matchPath(path)).equal(false);
      should(card1.matchPath(path)).equal(true);
      should(card2.matchPath(path)).equal(false);
    });

    let card2Paths = [
      "/wiki/a/b%20c",
      "/wiki/a/b%20c/",
      "/WIKI/A/B%20C",
      "/WIKI/A/B%20C/",
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

      let path = `/search/a%20b/${langTrans}`;
      should(card2.matchPath(path)).equal(true);

    let noPaths = [
      "/search/nothing",
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
    ];
    card0Paths.forEach(path => {
      should(card0.matchPath(path)).equal(true);
      should(card1.matchPath(path)).equal(false);
      should(card2.matchPath(path)).equal(false);
    });

    let card1Paths = [
      `/search//${langTrans}`,
    ];
    card1Paths.forEach(path=>{
      should(card0.matchPath(path)).equal(false);
      should(card1.matchPath(path)).equal(true);
      should(card2.matchPath(path)).equal(false);
    });

    let card2Paths = [
      `/search/a%20b/${langTrans}`,
      //`/search/a%20b/${langTrans}/`,
      //`/SEARCH/A%20B/${langTrans.toUpperCase()}`,
      //`/SEARCH/A%20B/${langTrans.toUpperCase()}/`,
    ];
    card2Paths.forEach(path=>{
      should(card0.matchPath(path)).equal(false);
      should(card1.matchPath(path)).equal(false);
      should(card2.matchPath(path)).equal(true);
    });
  });
  it("TESTTESTpathToCard() search", ()=>{
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
    let cardHome = EbtCard.pathToCard('/', cards, addCard);
    should.deepEqual(cards, [cardHome]);
    let cardHome2 = EbtCard.pathToCard('/', cards, addCard);
    should.deepEqual(cards, [cardHome]);

    let cardSearch = EbtCard.pathToCard('/search', cards, addCard);
    should.deepEqual(cards, [cardHome, cardSearch]);
    let cardSearch2 = EbtCard.pathToCard('/search', cards, addCard);
    should.deepEqual(cards, [cardHome, cardSearch]);

    let cardSearchAB = EbtCard.pathToCard('/search/a%20b', cards, addCard);
    should.deepEqual(cards, [cardHome, cardSearch, cardSearchAB]);
    let cardSearchAB2 = EbtCard.pathToCard('/search/a%20b', cards, addCard);
    should.deepEqual(cards, [cardHome, cardSearch, cardSearchAB]);

    let cardSearchABC = EbtCard.pathToCard('/search/a%20b/c', cards, addCard);
    should.deepEqual(cards, [cardHome, cardSearch, cardSearchAB, cardSearchABC]);
    let cardSearchAB3 = EbtCard.pathToCard('/search/a%20b/c', cards, addCard);
    should.deepEqual(cards, [cardHome, cardSearch, cardSearchAB, cardSearchABC]);
    let cardSearchABC2 = EbtCard.pathToCard('/search/a%20b/c', cards, addCard);
    should.deepEqual(cards, [cardHome, cardSearch, cardSearchAB, cardSearchABC]);

    should(nAdd).equal(4);
  });
});


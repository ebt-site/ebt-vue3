import { default as EbtCard } from "../src/ebt-card.mjs";
import should from "should";

(typeof describe === 'function') && describe("ebt-card.mjs", function () {
  it("TESTTESTdefault ctor", async () => {
    let card1 = new EbtCard();
    let card2 = new EbtCard();
    let defaultProps = {
      context: EbtCard.CONTEXT_HOME,
      location: [],
      isOpen: true,
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
    let context = 'test-context';
    let location = 'test-location';
    let card1 = new EbtCard({id, context, location});
    should(card1).properties({id, context, location: [location]});
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
  it("TESTTESTmatchPath", async() => {
    let card0 = new EbtCard({ context: "" });
    let card1 = new EbtCard({ context: "search", });
    let card2 = new EbtCard({ context: "SEARCH", location: "root of suffering", });

    let noPaths = [
      "/search/nothing",
      "/wiki",
      "search",
      "search/a",
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
      "/search",
      "/SEARCH",
      "/SEARCH/",
      "/SEARCH//",
    ];
    card1Paths.forEach(path=>{
      should(card0.matchPath(path)).equal(false);
      should(card1.matchPath(path)).equal(true);
      should(card2.matchPath(path)).equal(false);
    });

    let card2Paths = [
      "/search/root%20of%20suffering",
      "/SEARCH/root%20of%20suffering/",
      "/SEARCH/root%20of%20suffering",
      "/SEARCH/root%20of%20suffering/",
    ];
    card2Paths.forEach(path=>{
      should(card0.matchPath(path)).equal(false);
      should(card1.matchPath(path)).equal(false);
      should(card2.matchPath(path)).equal(true);
    });
  });
  it("TESTTESTpathToCard()", ()=>{
    let cards = [];
    let nAdd = 0;
    let addCard = (opts) => {
      let card = new EbtCard(opts);
      //console.log(`added card`, card);
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

    should(nAdd).equal(3);
  });
});


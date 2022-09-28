import { default as EbtCard } from "../src/ebt-card.mjs";
import should from "should";

(typeof describe === 'function') && describe("ebt-card.mjs", function () {
  it("TESTTESTdefault ctor", async () => {
    let card1 = new EbtCard();
    let card2 = new EbtCard();
    let defaultProps = {
      context: undefined,
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
    should(card.icon).equal("mdi-alert-icon");
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
    let card0 = new EbtCard({ context: undefined });
    let card1 = new EbtCard({
      context: "search",
    });
    let card2 = new EbtCard({
      context: "SEARCH",
      location: "DN33",
    });

    let card0Paths = [
      "/",
    ];
    card0Paths.forEach(path => {
      should(card0.matchPath(path)).equal(true, path);
      should(card1.matchPath(path)).equal(false, path);
      should(card2.matchPath(path)).equal(false, path);
    });

    let card1Paths = [
      "/search",
      "/SEARCH",
      "/SEARCH/",
      "/SEARCH//",
    ];
    card1Paths.forEach(path=>{
      should(card0.matchPath(path)).equal(false, path);
      should(card1.matchPath(path)).equal(true, path);
      should(card2.matchPath(path)).equal(false, path);
    });

    let card2Paths = [
      "/search/dn33",
      "/SEARCH/dn33/",
      "/SEARCH/DN33",
      "/SEARCH/DN33/",
    ];
    card2Paths.forEach(path=>{
      should(card0.matchPath(path)).equal(false, path);
      should(card1.matchPath(path)).equal(false, path);
      should(card2.matchPath(path)).equal(true, path);
    });
  });
});


import { default as EbtCard } from "../src/ebt-card.mjs";
import should from "should";

(typeof describe === 'function') && describe("ebt-card.mjs", function () {
  it("TESTTESTdefault ctor", async () => {
    let card1 = new EbtCard();
    let card2 = new EbtCard();
    let defaultProps = {
      context: "wiki",
      location: "welcome",
      isOpen: true,
    }
    should(card1.id.length).equal(36);
    should(card1).properties(defaultProps);

    should(card2.id).not.equal(card1.id);
    should(card2).properties(defaultProps);
  });
  it("TESTTESTcustom ctor", async () => {
    let id = 'test-id';
    let context = 'test-context';
    let location = 'test-location';
    let card1 = new EbtCard({id, context, location});
    should(card1).properties({id, context, location});
    let card2 = new EbtCard(Object.assign({}, card1));
    should(card2).properties(card1);
  });
  it("TESTTESTicon", async() => {
    let card = new EbtCard();
    should(card.icon).equal("mdi-wikipedia");
  });
  it("TESTTESTstringify", async() => {
    let card1 = new EbtCard();
    let json = JSON.stringify(card1);
    let card2 = new EbtCard(JSON.parse(json));
    should(card2).properties(card1);
  });
});

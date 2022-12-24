import Utils from "../src/utils.mjs";
import should from "should";

typeof describe === "function" && describe("utils", function() {
  it ("assignTyped()", ()=>{
    let initial = {
      aString: 'init-string',
      aDate: new Date(2020,2,1),
      aBool: true,
      aNumber: 42,
      aArray: ['A'],
      aInitial: "initial",
    };
    let srcDate = new Date(2021, 3, 2);
    let src = {
      aString: 123,
      aDate: srcDate.toString(),
      aBool: "false",
      aIgnore: "ignore",
      aNumber: "123",
      aArray: ['B','C'],
    };
    let dst = {};
    should.deepEqual(Utils.assignTyped(dst, src, initial), {
      aString: "123", // override initial with src
      aDate: srcDate, // from src
      aBool: false, // convert src type
      aNumber: 123, // convert src type
      aArray: ['B','C'],
    });
  });
})

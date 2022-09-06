(typeof describe === 'function') && describe("repo-info", function () {
  const should = require("should");
  const RepoInfo = require("../src/repo-info");

  it("info => repository info", async () => {
    let info = await RepoInfo.info();
    should.deepEqual(info, {
      account: 'ebt-site',
      repository: 'ebt-vue3',
    });
  });
})

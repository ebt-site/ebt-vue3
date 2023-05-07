import should from "should";
import fetch from "node-fetch";
import { logger } from "log-instance";
logger.logLevel = 'warn';

import { 
  SuttaDuration,
} from '../src/index.mjs';

(typeof describe === 'function') && describe("sutta-duration.mjs", function () {
  beforeEach(() => {
    global.fetch = fetch;
  });
  it("duration", async()=>{
    let sd = new SuttaDuration({fetch});
    await sd.initialize();
    should.deepEqual(sd.duration('mn44'), 1175.8849397020688);
  });
})

import { default as IdbAudio } from "../src/idb-audio.mjs";
import should from "should";
import "fake-indexeddb/auto";
import { setActivePinia, createPinia } from 'pinia';
import fetch from "node-fetch";

class MockAudioContext {  
  constructor() {
    this.nResume = 0;
    this.nSuspend = 0;
    this.nClose = 0;
    this.state = "indeterminate";
    this.msStart = undefined;
  }

  get currentTime() {
    return Date.now() - this.msStart;
  }

  resume() {
    this.nResume++;
    switch (this.state) {
      case 'indeterminate':
      case 'suspended':
        this.state = "running";
        this.msStart = Date.now();
        break;
      case 'running':
        // do nothing
        break;
      case 'closed':
      default:
        throw new Error("MockAudioContext.resume() unknown state", this.state);
        break;
    }
  }

  suspend() {
    this.nSuspend++;
    this.state = "suspended";
  }

  close() {
    this.nClose++;
    this.state = "closed";
  }
}
global.AudioContext = MockAudioContext; // NodeJs has no AudioContext

(typeof describe === 'function') && describe("idb-audio.mjs", function () {
  beforeEach(() => {
    setActivePinia(createPinia());
    global.fetch = global.fetch || fetch;
  });
  it("TESTTEST default ctor", ()=>{
    let audio = new IdbAudio();
    should(audio.src).equal(IdbAudio.URL_NO_AUDIO);
    should(audio.currentTime).equal(0);
    should(audio.paused).equal(false);
    
    // mock verification
    let mockAudioContext = audio.audioContext;
    should(mockAudioContext).instanceof(MockAudioContext);
    should(mockAudioContext.nResume).equal(1);
    should(mockAudioContext.state).equal('running');
  });
  it("TESTTESTpause()", ()=>{
    let audio = new IdbAudio();
    should(audio.paused).equal(false);
    audio.pause();
    should(audio.paused).equal(true);
  });
  it("TESTTESTplay()", async ()=>{
    let audio = new IdbAudio();
    let promise = audio.play();
    should(promise).instanceOf(Promise);
    should(audio.paused).equal(false);
    let abuf = await promise;
    should(abuf.byteLength).above(138490).below(139510);
    should(abuf).instanceOf(ArrayBuffer);
  });
});

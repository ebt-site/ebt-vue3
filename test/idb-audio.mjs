import { default as IdbAudio } from "../src/idb-audio.mjs";
import { logger } from 'log-instance';
import should from "should";
import "fake-indexeddb/auto";
import { setActivePinia, createPinia } from 'pinia';
import fetch from "node-fetch";

logger.logLevel = 'warn';

const MOCK_DURATION = 1234;
const MOCK_AUDIO_DATA_LENGTH = 411;
const MOCK_NUMBER_OF_CHANNELS = 2;
const MOCK_SAMPLE_RATE = 22000;

class MockChannelData {
  constructor() {
    this.data = "MockChannelData";
    this.length = this.data.length;
  }

  set(value, offset) {
    this.data = {value,offset};
  }
}

class MockAudioData {
  constructor() {
    this.sampleRate = MOCK_SAMPLE_RATE;
    this.numberOfChannels = MOCK_NUMBER_OF_CHANNELS;
    this.channels = [
      new Float32Array(MOCK_AUDIO_DATA_LENGTH),
      new Float32Array(MOCK_AUDIO_DATA_LENGTH),
    ];
    this.length = MOCK_AUDIO_DATA_LENGTH;
    console.log("DBG0108 MockAudioData()");
  }

  getChannelData(channelNumber) {
    return this.channels[channelNumber];
  }
}

class MockBuffer {
  constructor(numberOfChannels, length, sampleRate) {
    Object.assign(this, {
      numberOfChannels, 
      length, 
      sampleRate,
      duration: MOCK_DURATION,
    })
    console.log("DBG0108 MockBuffer()");
  }

  getChannelData() {
    return new MockChannelData();
  }
}

class MockBufferSource {
  constructor() {
    this.onended = evt => {
      console.log(`MockBufferSource.onended()`, evt);
    };
  }

  connect(dst) {
    logger.debug(`MockBufferSource.connect()`, dst);
  }

  start() {
    let that = this;
    console.log(`MockBufferSource.start()`);
    let promise = new Promise(resolve=>setTimeout(resolve,50));
    promise.then(()=>{
      console.log("MockBufferSource.start() onended");
      let evt = new Event('onended');
      that.onended(evt);
    });
    promise.catch(e=>console.log("MockBufferSOurce.start() ERROR", e.message));
    console.log(`MockBufferSource.start() promise`);
    return promise;
  }
}

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

  createBuffer(numberOfChannels, length, sampleRate) {
    return new MockBuffer(numberOfChannels, length, sampleRate);
  }

  createBufferSource() {
    console.log("DBG0108 MockAudioContext.createBufferSource()");
    return new MockBufferSource();
  }

  async decodeAudioData(arrayBuffer, resolve, reject) {
    console.log("DBG0108 MockAudioContext.decodeAudioData()");
    resolve(new MockAudioData());
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
  it("default ctor", ()=>{
    let audio = new IdbAudio();
    should(audio.src).equal(IdbAudio.URL_NO_AUDIO);
    should(audio.currentTime).equal(0);
    should(audio.duration).equal(0);
    should(audio.paused).equal(false);
    should(audio.preload).equal(false);
    
    // mock verification
    let mockAudioContext = audio.audioContext;
    should(mockAudioContext).instanceof(MockAudioContext);
    should(mockAudioContext.nResume).equal(1);
    should(mockAudioContext.state).equal('running');
  });
  it("DOMException", ()=>{
    let eDom = new DOMException('testDOMException', 'InvalidStateError');
    try {
      throw eDom
    } catch(e) {
      should(e).equal(eDom);
      should(e.message).equal('testDOMException');
      should(e.code).equal(11);
      should(e.name).equal('InvalidStateError');
    }
  });
  it("pause()", async()=>{
    let audio = new IdbAudio();

    // not playing
    should(audio.paused).equal(false);
    should(audio.currentTime).equal(0);
    should(audio.currentTime).equal(0); // Double-check

    // pausing halts progress of currentTime
    audio.play();
    let playTime = audio.currentTime;
    should(audio.currentTime).above(0);
    await new Promise(resolve=>setTimeout(resolve,5));
    should(audio.currentTime).above(playTime);
    should(audio.paused).equal(false);
    audio.pause();
    should(audio.paused).equal(true);
    let currentTime = audio.currentTime;
    should(audio.currentTime).equal(currentTime);
  });
  it("duration", async ()=>{
    let src = IdbAudio.URL_NO_AUDIO;
    let preload = true;
    let audio = new IdbAudio({src, preload});
    should(audio.preload).equal(true);
    should(audio.duration).equal(0);
    await new Promise(r=>setTimeout(r,1000));
    console.log("DBG0108 test duration", audio.audioBuffer);
    should(audio.duration).equal(MOCK_DURATION);
  });
  it("play()", async ()=>{
    let audio = new IdbAudio();

    // play resolves when playing has started
    should(audio.currentTime).equal(0);
    let promise = audio.play();
    await new Promise(resolve=>setTimeout(resolve,5));
    should(audio.currentTime).above(0);
    should(promise).instanceOf(Promise);
    should(audio.paused).equal(false);
    let result = await promise;
    let playTime = audio.currentTime;
    should(audio.paused).equal(false);
    should(playTime).above(-1).below(10);

    // while playing, currentTime should increase
    await new Promise(resolve=>setTimeout(resolve,5));
    should(audio.currentTime).above(playTime);

    let abuf = result; // unspecified in Web Api
    should(abuf.byteLength).above(138490).below(139510);
    should(abuf).instanceOf(ArrayBuffer);
  });
  it("TESTTESTcurrentTime", async ()=>{
    let audio = new IdbAudio();

    // Initial state
    should(audio.currentTime).equal(0);

    // currentTime increases while playing
    let play1 = audio.play();
    let play1Time = audio.currentTime;
    await new Promise(resolve=>setTimeout(resolve,5));
    should(audio.currentTime).above(play1Time);

    // currentTime does not increase while paused
    audio.pause();
    let pauseTime = audio.currentTime;
    should(pauseTime).above(0);
    await new Promise(resolve=>setTimeout(resolve,5));
    should(audio.currentTime).equal(pauseTime);

    // currentTime increases while playing
    let play2 = audio.play();
    let play2Time = audio.currentTime;
    await new Promise(resolve=>setTimeout(resolve,5));
    should(audio.currentTime).above(pauseTime);
    should(audio.currentTime).above(play1Time);
    should(audio.currentTime).above(play2Time);
  });
});

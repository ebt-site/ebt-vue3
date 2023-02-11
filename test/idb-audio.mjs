import { default as IdbAudio } from "../src/idb-audio.mjs";
import { useAudioStore } from '../src/stores/audio.mjs';
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
  }

  getChannelData() {
    return new MockChannelData();
  }
}

class MockBufferSource {
  constructor() {
    this.onended = evt => {
    };
  }

  connect(dst) {
    const msg = 'MockBufferSource.connect() ';
    logger.debug(msg + dst);
  }

  start() {
    const msg = 'MockBufferSource.start() ';
    let that = this;
    let promise = new Promise(resolve=>setTimeout(resolve,50));
    promise.then(()=>{
      let evt = new Event('onended');
      that.onended(evt);
    });
    promise.catch(e=>console.warn(msg + "ERROR", e.message));
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
    return new MockBufferSource();
  }

  async decodeAudioData(arrayBuffer, resolve, reject) {
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
    global.fetch = fetch;
  });
  it("default ctor", ()=>{
    let audio = new IdbAudio();
    should(audio.src).equal(IdbAudio.URL_NO_AUDIO);
    should(audio.currentTime).equal(0);
    should(audio.duration).equal(0);
    should(audio.paused).equal(false);
    should(audio.preload).equal(false);
    should(audio.audioBuffer).equal(null);
    should(audio.audioSource).equal(null);
    should(Date.now() - audio.created).above(-1).below(10);
    
    // mock verification
    let mockAudioContext = audio.audioContext;
    should(mockAudioContext).instanceof(MockAudioContext);
    should(mockAudioContext.nResume).equal(1);
    should(mockAudioContext.state).equal('running');
  });
  it("custom ctor", ()=>{
    let src = IdbAudio.URL_NO_AUDIO + '?' + Date.now();
    let created = Date.now();
    let preload = true;
    let audio = new IdbAudio({src, created, preload, });

    should(audio.src).equal(src);
    should(audio.preload).equal(preload);
    should(audio.created).equal(created);
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
    should(audio.currentTime).above(-1);
    await new Promise(resolve=>setTimeout(resolve,5));
    should(audio.currentTime).above(playTime);
    should(audio.paused).equal(false);
    audio.pause();
    should(audio.paused).equal(true);
    let currentTime = audio.currentTime;
    should(audio.currentTime).equal(currentTime);
  });
  it("duration", async ()=>{
    let audioStore = useAudioStore();
    let src = IdbAudio.URL_NO_AUDIO + '?' + Math.random();
    let preload = true;
    let nFetch0 = audioStore.nFetch;
    let audio = new IdbAudio({src, preload});
    should(audio.preload).equal(true);
    should(audio.duration).equal(0);
    await new Promise(r=>setTimeout(r,1000));
    should(audio.duration).equal(MOCK_DURATION);
    should(audioStore.nFetch).equal(nFetch0+1);
  });
  it("play()", async ()=>{
    let audio = new IdbAudio();

    // play resolves when playing has started
    should(audio.currentTime).equal(0);
    let promise = audio.play();
    await new Promise(resolve=>setTimeout(resolve,5));
    should(audio.audioBuffer).not.equal(null);
    should(audio.currentTime).above(-1);
    should(promise).instanceOf(Promise);
    should(audio.paused).equal(false);
    let result = await promise;
    let playTime = audio.currentTime;
    should(audio.paused).equal(false);
    should(playTime).above(-1).below(100);
    should(audio.audioBuffer).equal(null);

    // while playing, currentTime should increase
    await new Promise(resolve=>setTimeout(resolve,5));
    should(audio.currentTime).above(playTime);

    let abuf = result; // unspecified in Web Api
    should(abuf.byteLength).above(136000).below(139600);
    should(abuf).instanceOf(ArrayBuffer);
  });
  it("clear()", async()=>{
    let audio = new IdbAudio();
    await new Promise(resolve=>setTimeout(resolve,5));

    // false if nothing cleared
    audio.clear();
    should(audio.audioBuffer).equal(null);
    should(audio.audioSource).equal(null);

    // true if audio playing
    let promise = audio.play();
    should(audio.audioBuffer).not.equal(null);
    await new Promise(resolve=>setTimeout(resolve,50));
    audio.clear();
    should(audio.audioBuffer).equal(null);
    should(audio.audioSource).equal(null);
    should(audio.currentTime).equal(0);
  });
  it("currentTime", async ()=>{
    let audio = new IdbAudio();

    // Initial state
    should(audio.currentTime).equal(0);

    // currentTime increases while playing
    let play1 = audio.play();
    let play1Time = audio.currentTime;
    await new Promise(resolve=>setTimeout(resolve,50));
    should(audio.currentTime).above(play1Time-1);

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

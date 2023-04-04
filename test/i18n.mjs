
import should from "should";
import { logger } from "log-instance";
logger.logLevel = 'warn';

import { 
  Languages,
} from '../src/index.mjs';

(typeof describe === 'function') && describe("audio-store.mjs", function () {
  it("TESTTESTi18n", ()=>{
    should.deepEqual(Languages.REF_LANGS, [
      { value: 'de', title: 'Sabbamitta / DE', voice: true },                                  
      { value: 'en', title: 'Sujato / EN', voice: true },                                  
    ]);
    should.deepEqual(Languages.VOICE_LANGS, [
      { value: 'de', title: 'Deutsch / DE', voice: true },                                  
      { value: 'en', title: 'English / EN', voice: true },                                  
      { value: 'ja', title: '日本語 / JA', voice: true },                                   
      { value: 'pt', title: 'Português / PT', voice: true },
    ]);
    should.deepEqual(Languages.UI_LANGS, [
      { value: 'cs', title: 'Čeština / CS', voice: false },
      { value: 'da', title: 'Dansk / DA', voice: false },    
      { value: 'de', title: 'Deutsch / DE', voice: true },
      { value: 'en', title: 'English / EN', voice: true },
      { value: 'fr', title: 'Français / FR', voice: false },
      { value: 'hi', title: 'हिंदी / HI', voice: false }, 
      { value: 'is', title: 'Íslenska / IS', voice: false },
      { value: 'ja', title: '日本語 / JA', voice: true },
      { value: 'nb', title: 'Norsk / NB', voice: false },
      { value: 'nl', title: 'Nederlands / NL', voice: false },
      { value: 'pl', title: 'Polski / PL', voice: false },                                  
      { value: 'pt', title: 'Português / PT', voice: true },                                
      { value: 'ro', title: 'Română / RO', voice: false },
      { value: 'si', title: 'සිංහල / SI', voice: false },
      { value: 'vi', title: 'Tiếng Việt / VI', voice: false },
    ]);
  });
})

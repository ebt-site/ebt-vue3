(typeof describe === 'function') && describe("bilara-web", function() {
    const should = require("should");
    const fs = require('fs');
    const path = require('path');
    const { MerkleJson } = require('merkle-json');
    const {
      BilaraWeb,
      SuttaRef,
    } = require("../src/index");
    const { logger, LogInstance } = require('log-instance');
    const axios = require('axios');
    logger.logLevel = 'warn';
    const fetch = async function(url,opts){ 
        return {
            async json() {
                let res = await axios.get(url, opts);
                return res.data;
            }
        }
    }
    this.timeout(10*1000);
    const PLI_THIG1_1 = 'Therīgāthā 1.1 ';
    const VERSES_SENIOR_NUNS = "Verses of the Senior Nuns 1.1 ";
    const VERSES_ELDER_BHIKKHUNIS = "Verses of the Elder Bhikkhunīs ";
    const CHAPTER_OF_THE_ONES = "The Chapter of the Ones ";
    const BOOK_OF_THE_ONES = "The Book of the Ones ";
    const UNNAMED_NUN_1ST = "An Unnamed Nun (1st) ";
    const SLEEP_SOFTLY_LITTLE_NUN = 'Sleep softly, little nun, ';

    it("default ctor", ()=>{
        should.throws(()=>new BilaraWeb());
    });
    it("custom ctor", ()=>{
        let bw = new BilaraWeb({fetch});
        should.deepEqual(Object.keys(bw.examples).sort(), [
          'comment', 'authors', 'de', 'jpn', 'en'].sort());
        should(bw.fetch).equal(fetch);

        let examples = {
            de:[],
            en:[],
        };
        let bweg = new BilaraWeb({examples, fetch});
        should(bweg.examples).equal(examples);
        should(bweg.fetch).equal(fetch);
    });
    it("decodeHash() => hash object", ()=>{
        // vagga test: an2.31 is part of an2.27-31
        should.deepEqual(BilaraWeb.decodeHash('#an2.31/en/sujato:1.2'), {
            sutta_uid: 'an2.31',
            lang: 'en',
            translator: 'sujato',
            segnum: '1.2',
        });

        should.deepEqual(BilaraWeb.decodeHash(
            '#mn1/en/sujato:1.2?search=root%20of%20suffering'), {
            sutta_uid: 'mn1',
            lang: 'en',
            translator: 'sujato',
            segnum: '1.2',
            search: 'root of suffering',
        });
        should.deepEqual(BilaraWeb.decodeHash(
            '#?search=root%20of%20suffering'), {
            search: 'root of suffering',
        });
        should.deepEqual(BilaraWeb.decodeHash('#mn1/en/sujato:1.2'), {
            sutta_uid: 'mn1',
            lang: 'en',
            translator: 'sujato',
            segnum: '1.2',
        });
        should.deepEqual(BilaraWeb.decodeHash('#mn1/en/sujato'), {
            sutta_uid: 'mn1',
            lang: 'en',
            translator: 'sujato',
        });
        should.deepEqual(BilaraWeb.decodeHash('#mn1/en:1.2'), {
            sutta_uid: 'mn1',
            lang: 'en',
            segnum: '1.2',
        });
        should.deepEqual(BilaraWeb.decodeHash('#mn1/en'), {
            sutta_uid: 'mn1',
            lang: 'en',
        });
        should.deepEqual(BilaraWeb.decodeHash('#mn1:1.2'), {
            sutta_uid: 'mn1',
            segnum: '1.2',
        });
        should.deepEqual(BilaraWeb.decodeHash('#mn1'), {
            sutta_uid: 'mn1',
        });
        should.deepEqual(BilaraWeb.decodeHash(), {});
    });
    it("encodeHash(...) => URL hash dhp174:1", ()=>{
        let sutta_uid = 'dhp174';
        let segnum = '1';
        let search = 'like a bird';
        should(BilaraWeb.encodeHash({sutta_uid, segnum, search}))
            .equal('#dhp174:1?search=like+a+bird');
        should(BilaraWeb.encodeHash({sutta_uid, segnum}))
            .equal('#dhp174:1');
    });
    it("encodeHash(...) => URL hash", ()=>{
        let sutta_uid = 'mn1';
        let lang = 'de';
        let translator = 'sabbamitta';
        let segnum = '1.2';
        let search = 'root of suffering';
        should(BilaraWeb.encodeHash({sutta_uid, lang, translator, segnum, search}))
            .equal('#mn1/de/sabbamitta:1.2?search=root+of+suffering');
        should(BilaraWeb.encodeHash({search}))    // only search
            .equal('#?search=root+of+suffering'); // only full sutta segment reference
        should(BilaraWeb.encodeHash({sutta_uid, lang, translator, segnum}))
            .equal('#mn1/de/sabbamitta:1.2');     // only short sutta segment reference
        should(BilaraWeb.encodeHash({sutta_uid, segnum}))
            .equal('#mn1:1.2');
    });
    it("isExample", async()=>{
        var bw = new BilaraWeb({
            fetch,
            lang: 'en', // English default
        });
        should(bw.isExample('root of suffering')).equal('en');
        should(bw.isExample('ROOT OF SUFFERING')).equal('en');
        should(bw.isExample('root suffering')).equal(undefined);
        should(bw.isExample('Wurzel des Leidens')).equal('de');
        should(bw.isExample('fühlt.* es losgelöst', 'de')).equal('de');
        should(bw.isExample('Wurzel des Leidens', 'de')).equal('de');
        should(bw.isExample('wurzel des leidens', 'de')).equal('de');

        should(bw.isExample('\\bROOT OF SUFFERING')).equal('en');
        should(bw.isExample('\\bROOT OF SUFFERING\\b')).equal('en');
        should(bw.isExample('\\bROOT OF SUFFER\\b')).equal(undefined);
    });
    it("authors(...) => supported authors", async()=>{
      let bw = new BilaraWeb({fetch});
      let authors = bw.authors;
      should.deepEqual(authors.sabbamitta, {
        category: [ 'sutta' ],
        exampleVersion: 1,
        author: 'sabbamitta',
        lang: 'de',
        name: 'Sabbamitta',
        type: 'translator',
      });
    });
    it("exampleGuid(...) => en guid", async()=>{
        let bw = new BilaraWeb({fetch});
        let example = 'root of suffering';
        let lang = 'en';
        let guid_indent4 = 'f0453d300d1391f5bded7acb6b3ae5c0';
        let guid_indent2 = '93cc08f6e62c1ad2b4a220a334dfc93d';
        should(bw.exampleGuid(example, lang)).equal(guid_indent2);
    });
    it("exampleGuid(...) => de guid", async()=>{
        let bw = new BilaraWeb({fetch});
        let example = 'sei.* abhängig entstanden';
        let lang = 'de';
        let guid_indent4 = '6887db39e3f45d06e4e87ebf004a0334';
        let guid_indent2 = '59abab4175e60711fc204316ca632339';
        should(bw.exampleGuid(example, lang)).equal(guid_indent2);
    });
    it("kuhhirte(...) => de guid", async()=>{
        let bw = new BilaraWeb({fetch});
        let example = 'kuhhirte';
        let lang = 'de';
        let guid_indent4 = '36dfdd20e0733781b028a70d13973f94';
        let guid_indent2 = '1c1f97bab006c47a3f8ccf659543fb09';
        let verbose = 0;
        should(bw.exampleGuid(example, lang, verbose)).equal(guid_indent2);
    });
    it("find(...) finds mind with greed", async()=>{
        var bw = new BilaraWeb({fetch});
        var pattern = "mind with greed"; 
        var verbose = 0;
        var lang = 'en';
        var res = await bw.find({ pattern, lang, verbose });
        should.deepEqual(res.suttaRefs.slice(0,3), [
          'sn52.14/en/sujato',
          'sn51.11/en/sujato',
          'sn16.9/en/sujato',
        ]);
        should(res.bilaraPaths.length).equal(40);
    });
    it("find(...) finds inappropriate to talk", async()=>{
        var bw = new BilaraWeb({fetch});
        //bw.logLevel = 'info';
        var pattern = "inappropriate to talk"; 
        var verbose = 0;
        var lang = 'en';
        var res = await bw.find({ pattern, lang, verbose });
        should.deepEqual(res.suttaRefs, [
          'an5.157/en/sujato',
        ]);
        should(res.bilaraPaths.length).equal(2);
    });
    it("TESTTESTfind(...) finds de example", async()=>{
        var bw = new BilaraWeb({fetch});
        //bw.logLevel = 'info';
        var pattern = "abnehmend"; 
        var verbose = 0;
        var lang = 'de';
        var res = await bw.find({ pattern, lang, verbose });
        should.deepEqual(res.suttaRefs, [
          'sn12.33/de/sabbamitta',
          'sn12.2/de/sabbamitta',
          'sn12.28/de/sabbamitta',
          'sn12.27/de/sabbamitta',       
          'mn141/de/sabbamitta',
          'dn31/de/sabbamitta',
          'dn22/de/sabbamitta',
        ]);
        should(res.bilaraPaths.length).equal(21);
    });
    it("find(...) finds example", async()=>{
        var bw = new BilaraWeb({fetch});

        var pattern = "root of suffering"; 
        var res = await bw.find({
            pattern,
        });
        should.deepEqual(res.suttaRefs, [
            'sn42.11/en/sujato',
            'mn105/en/sujato',
            'mn1/en/sujato',
            'sn56.21/en/sujato',
            'mn66/en/sujato',
            'mn116/en/sujato',
            'dn16/en/sujato',
            //'pli-tv-kd6/en/brahmali',
        ]);
        should(res.bilaraPaths.length).equal(14);
    });
    it("find(...) finds example with quote", async()=>{
        let examples = {
            'en': [
                "but ma'am",
                "but not themselves",
            ],
        };
        var bw = new BilaraWeb({fetch, examples});
        //bw.logLevel = 'info';

        let text = "But ma’am, how does identity view come about?";
        should(/\bhow does/i.test(text)).equal(true);
        should(/\bbut ma’am/i.test(text)).equal(true); // right single quote
        should(/\bbut ma'am/i.test(text)).equal(false);
        should(/\bbut ma.am/i.test(text)).equal(true);
        should(bw.isExample(examples.en[0])).equal('en');

        var pattern = "but ma'am"; 
        var res = await bw.find({
            pattern,
        });
        should.deepEqual(res.suttaRefs, [
            'mn44/en/sujato',
        ]);
        should(res.bilaraPaths.length).equal(2);
    });
    it("highlightExamples(...) adds HTML links for examples", ()=>{
        let examples = {
            en: [
                'is.*\\bfeeling',
                'perception',
            ],
        };
        var bw = new BilaraWeb({fetch, examples});
        let segments = [
            {scid: 'sn12.23:1.5', pli: 'iti vedanā …pe…', en: 'Such is feeling …',},
            {scid: 'sn12.23:1.6', pli: 'iti saññā …', en: 'Such is perception …',},
            {scid: 'sn12.23:1.7', pli: 'iti saṅkhārā …', en: 'Such are choices …',},
        ];
        let lang = 'en';
        let text = "This is feeling, not unfeeling";
        let re = bw.reExample[lang];
        should(text.replace(re,'ASDF')).equal('This ASDF, not unfeeling');

        let segments2 = bw.highlightExamples({segments,lang});
        should.deepEqual(segments2[0], {
            scid: 'sn12.23:1.5', 
            pli: 'iti vedanā …pe…', 
            en: 'Such <span class="ebt-matched">is feeling</span> …',
        });
        
    });
    it("highlightExamples(...) handles quotes", ()=>{
        let examples = {
            en: [
                "but ma'am",
            ],
        };
        var bw = new BilaraWeb({fetch, examples});
        let segments = [
            {scid: 'mn44:9.1', en: `“But ma’am, what is the noble eightfold path?”`},
        ];
        let lang = 'en';
        let text = `“But ma’am, what is the noble eightfold path?”`;
        should(bw.reExample[lang].test(text)).equal(true);
        let re = bw.reExample[lang];
        should(text.replace(re,'ASDF')).equal(`“ASDF, what is the noble eightfold path?”`);

        let segments2 = bw.highlightExamples({segments,lang});
        should.deepEqual(segments2[0], {
            scid: 'mn44:9.1', 
            en: `“<span class="ebt-matched">But ma’am</span>, what is the noble eightfold path?”`,
        });
        
    });
    it("exampleOfMatch(...) returns en example", ()=>{
        let examples = {
            en: [
                'is.*\\bfeeling',
                'perception',
            ],
            de: [
                'königliches Gut',
            ],
        };
        var bw = new BilaraWeb({fetch, examples});
        should(bw.exampleOfMatch("Is a good Feeling")).equal(examples.en[0]);
    });
    it("exampleOfMatch(...) returns de example", ()=>{
        let examples = {
            en: [
                'is.*\\bfeeling',
                'perception',
            ],
            de: [
                'königliches Gut',
            ],
        };
        var bw = new BilaraWeb({fetch, examples});
        should(bw.exampleOfMatch('königliches Gut', 'de')).equal(examples.de[0]);
    });
    it("bilaraPathOf(...) SuttaRef => Bilara path", ()=>{
      let sutta_uid = 'thig1.1';
      let segnum = '0.1';
      var bwPli = new BilaraWeb({fetch, lang:'pli'});
      var bwEn = new BilaraWeb({fetch, lang:'en'});
      var bwDe = new BilaraWeb({fetch, lang:'de'});
      let SUJATO = 'translation/en/sujato/sutta';
      let SABBAMITTA = 'translation/de/sabbamitta/sutta';
      //bwEn.logLevel = 'info';

      // nothing
      should(bwEn.bilaraPathOf('nosutta')).equal(undefined);
      should(bwEn.bilaraPathOf('thig1.1/no-lang')).equal(undefined);
      should(bwEn.bilaraPathOf({sutta_uid, author:'nobody'})).equal(undefined);

      // Pali
      should(bwPli.bilaraPathOf('thig1.1')).equal(
        'root/pli/ms/sutta/kn/thig/thig1.1_root-pli-ms.json');
      should(bwDe.bilaraPathOf('thig1.1')).equal(
        `${SABBAMITTA}/kn/thig/thig1.1_translation-de-sabbamitta.json`);
      should(bwEn.bilaraPathOf('thig1.1')).equal(
        `${SUJATO}/kn/thig/thig1.1_translation-en-sujato.json`);
      should(bwEn.bilaraPathOf('thig1.1/pli')).equal(
        'root/pli/ms/sutta/kn/thig/thig1.1_root-pli-ms.json');
      should(bwEn.bilaraPathOf('thig1.1/pli/ms')).equal(
        'root/pli/ms/sutta/kn/thig/thig1.1_root-pli-ms.json');

      // English
      should(bwEn.bilaraPathOf('dn3')).equal(
        `${SUJATO}/dn/dn3_translation-en-sujato.json`);
      should(bwEn.bilaraPathOf('thig1.1/en')).equal(
        `${SUJATO}/kn/thig/thig1.1_translation-en-sujato.json`);
      should(bwDe.bilaraPathOf('thig1.1/en')).equal(
        `${SUJATO}/kn/thig/thig1.1_translation-en-sujato.json`);
      should(bwPli.bilaraPathOf('thig1.1/en')).equal(
        `${SUJATO}/kn/thig/thig1.1_translation-en-sujato.json`);
      should(bwEn.bilaraPathOf('thig1.1/en/sujato')).equal(
        `${SUJATO}/kn/thig/thig1.1_translation-en-sujato.json`);
      should(bwEn.bilaraPathOf('thig1.1/en/soma')).equal(
        'translation/en/soma/sutta/kn/thig/thig1.1_translation-en-soma.json');
      should(bwDe.bilaraPathOf('thig1.1/en/soma')).equal(
        'translation/en/soma/sutta/kn/thig/thig1.1_translation-en-soma.json');

      // German
      should(bwEn.bilaraPathOf('thig1.1/de')).equal(
        `${SABBAMITTA}/kn/thig/thig1.1_translation-de-sabbamitta.json`);
      should(bwEn.bilaraPathOf('thig1.1/de/sabbamitta')).equal(
        `${SABBAMITTA}/kn/thig/thig1.1_translation-de-sabbamitta.json`);
      should(bwPli.bilaraPathOf({sutta_uid, author:'sabbamitta'})).equal(
        `${SABBAMITTA}/kn/thig/thig1.1_translation-de-sabbamitta.json`);
      should(bwEn.bilaraPathOf({sutta_uid, author:'sabbamitta'})).equal(
        `${SABBAMITTA}/kn/thig/thig1.1_translation-de-sabbamitta.json`);
      should(bwEn.bilaraPathOf({sutta_uid, author:'sabbamitta'})).equal(
        `${SABBAMITTA}/kn/thig/thig1.1_translation-de-sabbamitta.json`);
    });
    it("loadBilaraPath(...) => thig1.1", async ()=>{
      // Pali
      var bwPli = new BilaraWeb({fetch, lang:'pli'});
      let bilaraPathPli = bwPli.bilaraPathOf('thig1.1');
      var resPli = await bwPli.loadBilaraPath(bilaraPathPli);
      should(resPli).properties({
        bilaraPath: bilaraPathPli,
        lang: 'pli',
        author: 'ms',
      });
      should(resPli.segments['thig1.1:0.1']).equal(PLI_THIG1_1);
      should(resPli.segments['thig1.1:0.2']).equal('Ekakanipāta ');
      should(resPli.segments['thig1.1:0.3']).equal('Aññatarātherīgāthā ');
      should(resPli.segments['thig1.1:1.1']).equal('“Sukhaṁ supāhi therike, ');

      // English
      var bwEn = new BilaraWeb({fetch, lang:'en'});
      let bilaraPathEn = bwEn.bilaraPathOf('thig1.1');
      var resEn = await bwEn.loadBilaraPath(bilaraPathEn);
      should(resEn).properties({
        bilaraPath: bilaraPathEn,
        lang: 'en',
        author: 'sujato',
      });
      should(resEn.segments['thig1.1:0.1']).equal(VERSES_SENIOR_NUNS);
      should(resEn.segments['thig1.1:0.2']).equal(BOOK_OF_THE_ONES);
      should(resEn.segments['thig1.1:0.3']).equal(UNNAMED_NUN_1ST);
      should(resEn.segments['thig1.1:1.1']).equal(SLEEP_SOFTLY_LITTLE_NUN);
    });
    it("loadBilaraPath(...) => thig1.1/en", async ()=>{
      let defaultLang = 'default-lang'
      var bw = new BilaraWeb({fetch, lang:defaultLang});
      let bilaraPath = bw.bilaraPathOf('thig1.1/en');
      var res = await bw.loadBilaraPath(bilaraPath);
      should(res).properties({
        bilaraPath,
        lang: 'en',
        author: 'sujato',
      });
      should(res.segments['thig1.1:0.1']).equal(VERSES_SENIOR_NUNS);
      should(res.segments['thig1.1:0.2']).equal(BOOK_OF_THE_ONES);
      should(res.segments['thig1.1:0.3']).equal(UNNAMED_NUN_1ST);
      should(res.segments['thig1.1:1.1']).equal(SLEEP_SOFTLY_LITTLE_NUN);
    });
    it("loadBilaraPath(...) => thig1.1/en/sujato", async ()=>{
      let defaultLang = 'default-lang'
      var bw = new BilaraWeb({fetch, lang:defaultLang});
      let bilaraPath = bw.bilaraPathOf('thig1.1/en/sujato');
      var res = await bw.loadBilaraPath(bilaraPath);
      should(res).properties({
        bilaraPath,
        lang: 'en',
        author: 'sujato',
      });
      should(res.segments['thig1.1:0.1'])
        .equal(VERSES_SENIOR_NUNS);
      should(res.segments['thig1.1:0.2']).equal(BOOK_OF_THE_ONES);
      should(res.segments['thig1.1:0.3']).equal(UNNAMED_NUN_1ST);
      should(res.segments['thig1.1:1.1']).equal(SLEEP_SOFTLY_LITTLE_NUN);
    });
    it("loadBilaraPath(...) => thig1.1/en/soma", async ()=>{
      let defaultLang = 'default-lang'
      var bw = new BilaraWeb({fetch, lang:defaultLang});
      let bilaraPath = bw.bilaraPathOf('thig1.1/en/soma');
      var res = await bw.loadBilaraPath(bilaraPath);
      should(res).properties({
        bilaraPath,
        lang: 'en',
        author: 'soma',
      });
      should(res.segments['thig1.1:0.1']).equal(VERSES_ELDER_BHIKKHUNIS);
      should(res.segments['thig1.1:0.2']).equal(CHAPTER_OF_THE_ONES);
      should(res.segments['thig1.1:0.3']).equal('Verses of a Certain Unknown Elder ');
      should(res.segments['thig1.1:1.1']).equal('“Sleep with ease, Elder, ');
    });
    it("loadBilaraPath(...) => thig1.1/xyz", async ()=>{
      let defaultLang = 'default-lang'
      var bw = new BilaraWeb({fetch, lang:defaultLang});
      let bilaraPath = bw.bilaraPathOf('thig1.1/xyz'); // non-existent Bilara path
      let eCaught;
      try  {
        let res = await bw.loadBilaraPath(bilaraPath);
      } catch(e) {
        eCaught = e;
      }
      should(eCaught.message).match(/assert\(bilaraPath\)/);
    });
    it("loadSuttaRef(...) => sn35.7 (soma/sabbamitta) none/none", async ()=>{
        let bw = new BilaraWeb({fetch});
        let lang = 'en';
        let sutta_uid = 'sn35.7';
        let suttaRefSoma = `${sutta_uid}/${lang}/soma`;

        // Soma + Sabbamitta/DE
        let refLang = 'de';
        let suttaSomaDE = await bw.loadSuttaRef(suttaRefSoma, refLang);
        should(suttaSomaDE).properties({sutta_uid, lang:undefined, author:undefined});
        should.deepEqual(suttaSomaDE.segments[1],{
            scid: 'sn35.7:0.2',
            pli: '1. Aniccavagga ',
        });

        // Soma has no translation for SN35.7
        let suttaSoma = await bw.loadSuttaRef(suttaRefSoma);
        should(suttaSoma).properties({sutta_uid, lang:undefined, author:undefined});
        should.deepEqual(suttaSoma.segments[1],{
            scid: 'sn35.7:0.2',
            pli: '1. Aniccavagga ',
        });
    });
    it("loadSuttaRef(...) => thig1.1 (soma/sujato)", async ()=>{
        let bw = new BilaraWeb({fetch});
        let author = 'soma';
        let lang = 'en';
        let sutta_uid = 'thig1.1';

        // Soma
        let suttaRefSoma = `${sutta_uid}/${lang}/${author}`;
        let suttaSoma = await bw.loadSuttaRef(suttaRefSoma);
        should(suttaSoma).properties({sutta_uid, lang, author});
        should(suttaSoma.refAuthor).equal(undefined);
        should.deepEqual(suttaSoma.segments[0],{
            scid: 'thig1.1:0.1',
            pli: PLI_THIG1_1,
            //en: VERSES_SENIOR_NUNS,
            en: VERSES_ELDER_BHIKKHUNIS,
        });

        // EN (Sujato)
        let suttaRefEn = `${sutta_uid}/${lang}`;
        let suttaEn = await bw.loadSuttaRef(suttaRefEn);
        should(suttaEn).properties({sutta_uid, lang, author:'sujato'});
        should(suttaEn.refAuthor).equal(undefined);
        should.deepEqual(suttaEn.segments[0],{
            scid: 'thig1.1:0.1',
            pli: PLI_THIG1_1,
            en: VERSES_SENIOR_NUNS,
        });
    });
    it("loadSuttaRef(...) => thig1.1", async ()=>{
        let bw = new BilaraWeb({fetch});
        let author = 'sujato';
        let lang = 'en';
        let sutta_uid = 'thig1.1';
        let suttaRef = `thig1.1`;
        let sutta = await bw.loadSuttaRef(suttaRef);
        should(sutta).properties({sutta_uid, lang, author});
        should.deepEqual(sutta.segments[0],{
            scid: 'thig1.1:0.1',
            pli: PLI_THIG1_1,
            en: VERSES_SENIOR_NUNS,
        });
    });
    it("loadSuttaRef(...) => thig1.1 (en/sujato)", async ()=>{
        let bw = new BilaraWeb({fetch});
        let author = 'sujato';
        let lang = 'en';
        let sutta_uid = 'thig1.1';
        let suttaRef = `thig1.1/${lang}/${author}`;
        let sutta = await bw.loadSuttaRef(suttaRef);
        should(sutta).properties({sutta_uid, lang, author});
        should.deepEqual(sutta.segments[0],{
            scid: 'thig1.1:0.1',
            pli: PLI_THIG1_1,
            en: VERSES_SENIOR_NUNS,
        });
    });
    it("loadSuttaRef(...) => thig1.1 (en)", async ()=>{
        let bw = new BilaraWeb({fetch});
        let author = 'sujato';
        let lang = 'en';
        let sutta_uid = 'thig1.1';
        let suttaRef = `thig1.1/${lang}`;
        let sutta = await bw.loadSuttaRef(suttaRef);
        should(sutta).properties({sutta_uid, lang, author});
        should.deepEqual(sutta.segments[0],{
            scid: 'thig1.1:0.1',
            pli: PLI_THIG1_1,
            en: VERSES_SENIOR_NUNS,
        });
      });
    it("loadSuttaRef(...) => thig1.1 (en) refLang:de", async ()=>{
        let bw = new BilaraWeb({fetch});
        let author = 'sujato';
        let lang = 'en';
        let sutta_uid = 'thig1.1';
        let suttaRef = `thig1.1/${lang}`;
        let refLang = 'de';
        let refAuthor = 'sabbamitta';
        let sutta = await bw.loadSuttaRef(suttaRef, refLang);
        should(sutta).properties({sutta_uid, lang, author, refAuthor});
        should.deepEqual(sutta.segments[0],{
            scid: 'thig1.1:0.1',
            pli: PLI_THIG1_1,
            ref: 'Strophen der altehrwürdigen Nonnen ',
            en: VERSES_SENIOR_NUNS,
        });
    });
    it("loadSuttaRef(...) => thig1.1 (sujato)", async ()=>{
        let bw = new BilaraWeb({fetch});
        //bw.logLevel = 'info';
        let author = 'sujato';
        let lang = 'en';
        let sutta_uid = 'thig1.1';
        let suttaRef = { sutta_uid, author:'sujato' };
        let sutta = await bw.loadSuttaRef(suttaRef);
        should(sutta).properties({sutta_uid, lang, author});
        should.deepEqual(sutta.segments[0],{
            scid: 'thig1.1:0.1',
            pli: PLI_THIG1_1,
            en: VERSES_SENIOR_NUNS,
        });
    });
    it("loadSuttaRef(...) => thig1.1 (soma)", async ()=>{
        let bw = new BilaraWeb({fetch});
        //bw.logLevel = 'info';
        let author = 'soma';
        let lang = 'en';
        let sutta_uid = 'thig1.1';
        let suttaRef = `${sutta_uid}/${lang}/${author}`;
        let sutta = await bw.loadSuttaRef(suttaRef);
        should(sutta).properties({sutta_uid, lang, author});
        should.deepEqual(sutta.segments[0],{
            scid: 'thig1.1:0.1',
            pli: PLI_THIG1_1,
            en: VERSES_ELDER_BHIKKHUNIS,
            //ref: VERSES_SENIOR_NUNS,
        });
    });
    it("loadSuttaRef(...) => thig1.1 (soma) refLang:en", async ()=>{
        let bw = new BilaraWeb({fetch});
        //bw.logLevel = 'info';
        let author = 'soma';
        let lang = 'en';
        let sutta_uid = 'thig1.1';
        let suttaRef = `${sutta_uid}/${lang}/${author}`;
        let refLang = 'en';
        let sutta = await bw.loadSuttaRef(suttaRef, refLang);
        should(sutta).properties({sutta_uid, lang, author});
        should.deepEqual(sutta.segments[0],{
            scid: 'thig1.1:0.1',
            pli: PLI_THIG1_1,
            en: VERSES_ELDER_BHIKKHUNIS,
            ref: VERSES_SENIOR_NUNS,
        });
    });
    it("loadSuttaRef(...) => thig1.1 (de)", async ()=>{
        let bw = new BilaraWeb({fetch});
        //bw.logLevel = 'info';
        let author = 'sabbamitta';
        let lang = 'de';
        let sutta_uid = 'thig1.1';
        let suttaRef = `${sutta_uid}/${lang}`;
        let sutta = await bw.loadSuttaRef(suttaRef);
        should(sutta).properties({sutta_uid, lang, author});
        should.deepEqual(sutta.segments[0],{
            scid: 'thig1.1:0.1',
            pli: PLI_THIG1_1,
            de: 'Strophen der altehrwürdigen Nonnen ',
        });
    });
    it("loadSuttaRef(...) => thig1.1 (sabbamitta)", async ()=>{
        let bw = new BilaraWeb({fetch});
        //bw.logLevel = 'info';
        let sutta_uid = 'thig1.1';
        let lang = 'de';
        let author = 'sabbamitta';
        let suttaRef = {sutta_uid, author};
        let sutta = await bw.loadSuttaRef(suttaRef);
        should(sutta).properties({sutta_uid, lang, author});
        should.deepEqual(sutta.segments[0],{
            scid: 'thig1.1:0.1',
            pli: PLI_THIG1_1,
            de: 'Strophen der altehrwürdigen Nonnen ',
        });
    });
    it("loadSuttaRef(...) => thig1.1 (sabbamitta) ref:de", async ()=>{
        let bw = new BilaraWeb({fetch});
        //bw.logLevel = 'info';
        let sutta_uid = 'thig1.1';
        let lang = 'de';
        let author = 'sabbamitta';
        let refLang = 'de';
        let suttaRef = {sutta_uid, author};
        let sutta = await bw.loadSuttaRef(suttaRef, refLang);
        should(sutta).properties({sutta_uid, lang, author});
        should.deepEqual(sutta.segments[0],{
            scid: 'thig1.1:0.1',
            pli: PLI_THIG1_1,
            de: 'Strophen der altehrwürdigen Nonnen ',
            ref: 'Strophen der altehrwürdigen Nonnen ',
        });
    });
    it("voices() returns voices", async()=>{
        let bw = new BilaraWeb({fetch});
        let voices = await bw.voices();
        let enNames = voices.filter(v=>v.langTrans === 'en').map(v=>v.name);
        should.deepEqual(enNames, [
            'Amy', 'Raveena', 'Matthew', 'Brian', 'sujato_en']);
    });
    it("voices() returns voices", async()=>{
        let bw = new BilaraWeb({fetch});
        should(bw.langDefaultVoice()).properties({name: 'Amy'});
        should(bw.langDefaultVoice('de')).properties({name: 'Vicki'});
        should(bw.langDefaultVoice('ja')).properties({name: 'Takumi'});
        should(bw.langDefaultVoice('pt')).properties({name: 'Ricardo'});
    });
    it("parseSuttaRef() string", ()=>{
      let ctorLang = 'ctor=lang';
      let defaultLang = 'default-lang';
      let author = 'test-author';
      let lang = 'test-lang';
      let sutta_uid = 'thig1.1';
      let segnum = '0.1';
      let bw = new BilaraWeb({fetch, lang: ctorLang});

      // string sutta reference ctorLang
      should.deepEqual(bw.parseSuttaRef(`${sutta_uid}/${lang}/${author}:${segnum}`), {
        sutta_uid, lang, author, segnum,
      });
      should.deepEqual(bw.parseSuttaRef(`${sutta_uid}/${lang}/${author}`), {
        sutta_uid, lang, author, segnum: undefined,
      });
      should.deepEqual(bw.parseSuttaRef(`${sutta_uid}/${lang}`), {
        sutta_uid, lang, author: undefined, segnum: undefined,
      });
      should.deepEqual(bw.parseSuttaRef(`${sutta_uid}/${lang}:${segnum}`), {
        sutta_uid, lang, author: undefined, segnum,
      });
      should.deepEqual(bw.parseSuttaRef(`${sutta_uid}`), {
        sutta_uid, lang: ctorLang, author: undefined, segnum: undefined,
      });
      should.deepEqual(bw.parseSuttaRef(`${sutta_uid}:${segnum}`), {
        sutta_uid, lang: ctorLang, author: undefined, segnum,
      });

      // string sutta reference defaultLang
      should.deepEqual(
        bw.parseSuttaRef(`${sutta_uid}/${lang}/${author}:${segnum}`, defaultLang), {
        sutta_uid, lang, author, segnum,
      });
      should.deepEqual(
        bw.parseSuttaRef(`${sutta_uid}/${lang}/${author}`, defaultLang), {
        sutta_uid, lang, author, segnum: undefined,
      });
      should.deepEqual(
        bw.parseSuttaRef(`${sutta_uid}/${lang}`, defaultLang), {
        sutta_uid, lang, author: undefined, segnum: undefined,
      });
      should.deepEqual(
        bw.parseSuttaRef(`${sutta_uid}/${lang}:${segnum}`, defaultLang), {
        sutta_uid, lang, author: undefined, segnum,
      });
      should.deepEqual(
        bw.parseSuttaRef(`${sutta_uid}`, defaultLang), {
        sutta_uid, lang: defaultLang, author: undefined, segnum: undefined,
      });
      should.deepEqual(
        bw.parseSuttaRef(`${sutta_uid}:${segnum}`, defaultLang), {
        sutta_uid, lang: defaultLang, author: undefined, segnum,
      });
    });
    it("parseSuttaRef() object", ()=>{
      let ctorLang = 'ctor=lang';
      let defaultLang = 'default-lang';
      let author = 'test-author';
      let lang = 'test-lang';
      let sutta_uid = 'thig1.1';
      let segnum = '0.1';
      let bw = new BilaraWeb({fetch, lang: ctorLang});

      // string sutta reference
      should.deepEqual(bw.parseSuttaRef({sutta_uid, lang, author, segnum }), {
        sutta_uid, lang, author, segnum,
      });
      should.deepEqual(bw.parseSuttaRef({sutta_uid, lang, author}), {
        sutta_uid, lang, author, segnum: undefined,
      });
      should.deepEqual(bw.parseSuttaRef(`${sutta_uid}/${lang}`), {
        sutta_uid, lang, author: undefined, segnum: undefined,
      });
      should.deepEqual(bw.parseSuttaRef(`${sutta_uid}/${lang}:${segnum}`), {
        sutta_uid, lang, author: undefined, segnum,
      });
      should.deepEqual(bw.parseSuttaRef(`${sutta_uid}`), {
        sutta_uid, lang: ctorLang, author: undefined, segnum: undefined,
      });
      should.deepEqual(bw.parseSuttaRef(`${sutta_uid}:${segnum}`), {
        sutta_uid, lang: ctorLang, author: undefined, segnum,
      });
    });
    it("parseSuttaRef() an2.32-41", ()=>{
        let bw = new BilaraWeb({fetch});
        let pattern = 'an 2.41/de';
        let lang = 'de';
        should.deepEqual(bw.parseSuttaRef(pattern), {
            sutta_uid: 'an2.32-41',
            lang,
            author: undefined,
            segnum: undefined,
        });
    });
    it("parseSuttaRef() an2.32-41:1.2", ()=>{
        let bw = new BilaraWeb({fetch});
        let pattern = 'an 2.41/en/sujato:1.2';
        should.deepEqual(bw.parseSuttaRef(pattern), {
            sutta_uid: 'an2.32-41',
            lang: 'en',
            author: 'sujato',
            segnum: '1.2',
        });
    });
    it("suidPaths(suid) => path map", ()=>{
        let bw = new BilaraWeb({fetch});

        should.deepEqual(bw.suidPaths('dn33'), {
            'root/pli/ms': 
                'root/pli/ms/sutta/dn/dn33_root-pli-ms.json',
            'translation/de/sabbamitta': 
                'translation/de/sabbamitta/sutta/dn/dn33_translation-de-sabbamitta.json',
            'translation/en/sujato': 
                'translation/en/sujato/sutta/dn/dn33_translation-en-sujato.json',
            //'translation/my/my-team': 
                //'translation/my/my-team/sutta/dn/dn33_translation-my-my-team.json',
        });
    });
    it("segmentAudioUrls(...) => HTML5 audio sources", async()=>{
        let bw = new BilaraWeb({fetch});
        let urls = await bw.segmentAudioUrls({
            scid: 'sn12.23:1.1',
            lang: 'en',
            translator: 'sujato',
            vtrans: 'amy',
            vroot: 'aditi',
        });
        let endpoint = 'https://s1.sc-voice.net/scv/audio';
        let enGuid = `2b889573f11b1e26ff1f2a3113beb746`;
        let pliGuid = `4cde0928fd30c7920ea805960313a269`;
        should.deepEqual(urls, {
          en: `${endpoint}/sn12.23/en/sujato/amy/${enGuid}`,
          pli: `${endpoint}/sn12.23/pli/ms/aditi/${pliGuid}`,
        });
    });
})

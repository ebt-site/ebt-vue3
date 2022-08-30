(function (exports) {
  const { logger } = require("log-instance");
  const { MerkleJson } = require("merkle-json");
  const {
    Authors,
    Examples,
    SuidMap,
    SuttaCentralId,
    SuttaRef,
  } = require("scv-esm");
  const VOICES = require("./voices.json");
  const assert = require("assert");

  class BilaraWeb {
    constructor(opts = {}) {
      (opts.logger || logger).logInstance(this, opts);
      this.examples = opts.examples || Examples;
      this.suidMap = opts.suidMap || SuidMap;
      this.suids = Object.keys(this.suidMap).sort(SuttaCentralId.compareLow);
      this.lang = opts.lang || "en";
      this.mj = new MerkleJson();
      this.maxResults = opts.maxResults == null ? 1000 : opts.maxResults;
      if (opts.fetch == null) {
        throw new Error("BilaraWeb() fetch callback is required");
      }
      this.endpoints = Object.assign(
        {
          playSegment: "https://s1.sc-voice.net/scv/play/segment",
          audio: "https://s1.sc-voice.net/scv/audio",
        },
        opts.endpoints
      );
      this.fetch = opts.fetch;
      this.host = opts.host || "https://raw.githubusercontent.com";
      this.authors = Authors.authors;
      this.includeUnpublished = opts.includeUnpublished === true;

      // private
      Object.defineProperty(this, "suttaCache", {
        value: {},
      });

      let matchHighlight = (this.matchHighlight =
        opts.matchHighlight || '<span class="ebt-matched">$&</span>');
      this.highlightMatch =
        opts.highlightMatch ||
        ((match) => matchHighlight.replace("$&", match) || match);
    }

    static decodeHash(hash = "") {
      let hq = hash.substring(1).split("?");
      let hqParms = hq[1] && new URLSearchParams(`?${hq[1]}`);
      let search = hqParms && hqParms.get("search");
      let hc = hq[0].split(":");
      let [sutta_uid, lang, translator] = hc[0].split("/") || hc;
      let segnum = hc[1];
      let result = {};
      sutta_uid && (result.sutta_uid = sutta_uid);
      lang && (result.lang = lang);
      translator && (result.translator = translator);
      segnum && (result.segnum = segnum);
      search && (result.search = search);

      return result;
    }

    static encodeHash({ sutta_uid, lang, translator, segnum, search }) {
      let hash = "#";
      sutta_uid && (hash += sutta_uid);
      lang && (hash += `/${lang}`);
      translator && (hash += `/${translator}`);
      segnum && (hash += `:${segnum}`);
      if (search) {
        let parms = new URLSearchParams();
        parms.set("search", search);
        hash += `?${parms.toString()}`;
      }
      return hash;
    }

    static sanitizePattern(pattern) {
      if (!pattern) {
        throw new Error("search pattern is required");
      }
      const MAX_PATTERN = 1024;
      var excess = pattern.length - MAX_PATTERN;
      if (excess > 0) {
        throw new Error(
          `Search text too long by ${excess} characters: ${pattern}`
        );
      }
      // replace quotes (code injection on grep argument)
      pattern = pattern.replace(/["']/g, ".");
      // eliminate tabs, newlines and carriage returns
      pattern = pattern.replace(/\s/g, " ");
      // remove control characters
      pattern = pattern.replace(/[\u0000-\u001f\u007f]+/g, "");
      // must be valid
      new RegExp(pattern);

      return pattern;
    }

    static normalizePattern(pattern) {
      // normalize white space to space
      pattern = pattern.trim().replace(/[\s]+/g, " ").toLowerCase();

      return pattern;
    }

    get reExample() {
      var reExample = this._reExample;
      if (!reExample) {
        let examples = Object.assign({}, this.examples);
        delete examples.authors;
        delete examples.comments;
        reExample = Object.keys(examples).reduce((a, lang) => {
          let egLang = examples[lang].map((e) => BilaraWeb.sanitizePattern(e));
          let pat = egLang.join("|\\b");
          a[lang] = new RegExp(`\\b${pat}`, "gimu");
          return a;
        }, {});
        Object.defineProperty(this, "_reExample", reExample);
      }
      return reExample;
    }

    isExample(pattern, lang = this.lang) {
      return Examples.isExample(pattern);
    }

    exampleOfMatch(match, lang = "en") {
      let exLang = this.examples[lang] || [];
      return exLang.find((ex) => {
        let re = new RegExp(ex, "mui");
        return re.test(match);
      });
    }

    exampleGuid(example, lang = "en", verbose = false) {
      // TODO: THIS IS REALLY FRAGILE AND DEPENDS
      // ENTIRELY ON THE MEMOIZED FUNCTION IDENTATION IN
      // scv-bilara/src/seeker.js
      // IF THE IDENTATTION CHANGES, THE EXAMPLE GUIDS 
      // WILL NO LONGER MATCH!!!
      const fbody = [
        "(args) => {",
        "        return that.slowFind.call(that, args);",
        "      }",
      ].join("\n");
      let { includeUnpublished } = this;
      let key = {
        volume: "Seeker.callSlowFind",
        fbody,
        args: [
          {
            pattern: example,
            languages: lang === "en" ? ["pli", "en"] : ["pli", "en", lang],
            searchLang: lang,
            lang,

            showMatchesOnly: true,
            maxResults: 1000,
            maxDoc: 50,
            minLang: lang === "en" ? 2 : 3,
            matchHighlight: this.matchHighlight,
            types: ["root", "translation"],
            includeUnpublished,
            sortLines: undefined, // These are not serialized
            tipitakaCategories: undefined, // These are not serialized
          },
        ],
      };
      let guid = this.mj.hash(key);
      verbose &&
        console.log(
          `bilaraWeb.exampleGuid(${example}, ${lang}) => ${guid}`,
          JSON.stringify(key, null, 2)
        );
      return guid;
    }

    findArgs(args) {
      if (!(args instanceof Array)) {
        throw new Error("findArgs(?ARRAY-OF-ARGS?)");
      }
      if (typeof args[0] === "string") {
        var opts = {
          pattern: args[0],
          maxResults: args[1],
        };
      } else {
        var opts = args[0];
      }
      var {
        pattern: rawPattern,
        searchLang,
        lang,
        language, // DEPRECATED
        languages,
        minLang, // minimum number of languages
        maxResults, // maximum number of grep files
        maxDoc, // maximum number of returned documents
        matchHighlight,
        sortLines,
        showMatchesOnly,
        tipitakaCategories,
        types,
        includeUnpublished = this.includeUnpublished,
        verbose,
      } = opts;
      if (rawPattern == null) {
        throw new Error(`pattern is required`);
      }

      // STEP 1. extract embeddable options
      var argv = rawPattern.split(" ");
      var pattern = "";
      for (var i = 0; i < argv.length; i++) {
        var arg = argv[i];
        if (arg === "-d" || arg === "--maxDoc") {
          let n = Number(argv[++i]);
          if (!isNaN(n) && 0 < n) {
            maxDoc = n;
          }
        } else if (arg === "-mr" || arg === "--maxResults") {
          let n = Number(argv[++i]);
          if (!isNaN(n) && 0 < n && n < 4000) {
            maxResults = n;
          }
        } else if (arg.startsWith("-tc:")) {
          tipitakaCategories = arg.substring("-tc:".length);
        } else if (arg === "-ml1") {
          minLang = 1;
        } else if (arg === "-ml2") {
          minLang = 2;
        } else if (arg === "-ml3") {
          minLang = 3;
        } else if (arg === "-ml" || arg === "--minLang") {
          let n = Number(argv[++i]);
          if (!isNaN(n) && 0 < n && n <= 3) {
            minLang = n;
          }
        } else if (arg === "-l" || arg === "--lang") {
          (arg = argv[++i]) && (lang = arg);
        } else if (arg === "-sl" || arg === "--searchLang") {
          (arg = argv[++i]) && (searchLang = arg);
        } else {
          pattern = pattern ? `${pattern} ${arg}` : arg;
        }
      }

      // STEP 2. Assign default values
      var thisLang = this.lang;
      lang = lang || language || thisLang;
      minLang = minLang || (lang === "en" || searchLang === "en" ? 2 : 3);
      pattern = BilaraWeb.sanitizePattern(pattern);
      pattern = BilaraWeb.normalizePattern(pattern);
      showMatchesOnly == null && (showMatchesOnly = true);
      languages = languages || [];
      lang && !languages.includes(lang) && languages.push(lang);
      maxResults = maxResults == null ? this.maxResults : maxResults;
      if (isNaN(Number(maxResults))) {
        throw new Error(`maxResults must be a number:${maxResults}`);
      }
      maxResults = Number(maxResults);
      maxDoc = Number(maxDoc == null ? this.maxDoc : maxDoc);
      matchHighlight == null && (matchHighlight = this.matchHighlight);

      types = types || ["root", "translation"];

      return {
        pattern,
        showMatchesOnly,
        languages,
        maxResults,
        searchLang,
        maxDoc,
        minLang,
        matchHighlight,
        sortLines,
        tipitakaCategories,
        lang,
        types,
        includeUnpublished,
        verbose,
      };
    }

    async find(...args) {
      try {
        var { fetch, findMemo, memoizer } = this;
        var { lang, pattern, verbose } = this.findArgs(args);
        var that = this;
        var callSlowFind = (args) => {
          return that.slowFind.call(that, args);
        };
        var result;
        if (this.isExample(pattern, lang)) {
          let guid = this.exampleGuid(pattern, lang, verbose);
          let url = [
            "https://raw.githubusercontent.com",
            "ebt-site",
            "ebt-vue",
            "main",
            "api",
            "Seeker.callSlowFind",
            guid.substring(0, 2),
            `${guid}.json`,
          ].join("/");
          try {
            let res = await fetch(url, { headers: { Accept: "text/plain" } });
            result = (await res.json()).value;
          } catch (e) {
            let guid = this.exampleGuid(pattern, lang, true);
            let err = new Error(`${url} => ${e.message}`);
            throw err;
          }
        } else {
          this.info(`find() non-example:`, pattern);
        }
        return result;
      } catch (e) {
        this.warn(`find(${pattern})`, e.message);
        throw e;
      }
    }

    highlightExamples({ segments, lang = this.lang }) {
      let highlightMatch = this.highlightMatch;
      let reLang = this.reExample[lang];
      if (!reLang) {
        return segments;
      }
      return segments.map((seg) => {
        let segLang = seg[lang];
        let newSeg = Object.assign({}, seg);
        return segLang
          ? Object.assign(newSeg, {
              [lang]: segLang.replace(reLang, highlightMatch),
            })
          : newSeg;
      });
    }

    suidPaths(suid = "") {
      var suidParts = suid.split("/");
      var [key, lang, author] = suidParts;
      let map = this.suidMap[key];
      let keys = map && Object.keys(map);
      if (author) {
        let patAuth = new RegExp(`/${author.toLowerCase()}$`);
        keys = keys.filter((k) => k.match(patAuth) || k.match(`/pli/`));
      } else if (lang) {
        let patAuth = new RegExp(`/${lang.toLowerCase()}$`);
        let patLang = new RegExp(`/{lang.toLowerCase()/`);
        keys = keys.filter(
          (k) => k.match(patAuth) || k.match(patLang) || k.match(`/pli/`)
        );
      }
      return (
        map &&
        keys.reduce((a, k) => {
          let v = map[k];
          let kParts = k.split("/");
          let vParts = v.split("/");
          let suidParts = suid.split("/");
          a[k] = `${k}/${v}/${suidParts[0]}_${kParts.join("-")}.json`;
          return a;
        }, {})
      );
    }

    bilaraPathOf(suttaRef) {
      let { sutta_uid, lang, author } = SuttaRef.create(suttaRef, null) || {};
      let {
        authors,
        fetch,
        host,
        lang: defaultLang,
        includeUnpublished,
      } = this;
      let segments;
      let bilaraPaths = this.suidPaths(sutta_uid) || {};
      let bpKeys = Object.keys(bilaraPaths);
      if (author) {
        bpKeys = bpKeys.filter((bp) => bp.endsWith(`/${author}`));
      } else {
        bpKeys.length > 1 &&
          bpKeys.sort((a, b) => {
            let [aTrans, aLang, aId] = a.split("/");
            let [bTrans, bLang, bId] = b.split("/");
            // Prioritize sutta selection by author exampleVersion
            let aAuth = authors[aId] || {};
            let bAuth = authors[bId] || {};
            let aEV = aAuth.exampleVersion || 0;
            let bEV = bAuth.exampleVersion || 0;
            let cmp = bEV - aEV;
            return cmp;
          });
      }
      if (lang) {
        bpKeys = bpKeys.filter((key) => key.includes(`/${lang}/`));
      } else if (author == null) {
        bpKeys = bpKeys.filter((key) => key.includes(`/${defaultLang}/`));
      }
      let bpKey = bpKeys[0];
      let bilaraPath = bilaraPaths[bpKey];
      bilaraPath == null &&
        this.info(`bilaraPathOf(${bpKey}) undefined:`, suttaRef);
      return bilaraPath;
    }

    async loadBilaraPath(bilaraPath) {
      assert(bilaraPath);
      let { authors, fetch, host, includeUnpublished } = this;
      let segments;
      let branch = includeUnpublished ? "unpublished" : "published";
      let url = `${host}/suttacentral/bilara-data/${branch}/${bilaraPath}`;
      try {
        let res = await fetch(url, { headers: { Accept: "text/plain" } });
        segments = await res.json();
      } catch (e) {
        this.info(`loadBilaraPath(${sutta_uid}) ${url} => ${e.message}`);
      }
      let [segType, segLang, author] = bilaraPath.split("/") || [];
      let sutta = {
        bilaraPath,
        lang: segLang,
        author,
        segments,
      };
      Object.defineProperty(sutta, "translator", { value: author }); // deprecated
      return sutta;
    }

    async loadSuttaRef(suttaRef, refLang) {
      try {
        suttaRef = SuttaRef.create(suttaRef, null);
        let { sutta_uid, lang, author, segnum } = suttaRef;
        this.info("loadSuttaRef", {
          sutta_uid,
          lang,
          author,
          segnum,
          refLang,
        });
        let { suttaCache } = this;
        var url = "";
        let key = [sutta_uid, lang, author].join("/");
        let sutta = suttaCache[key];
        if (sutta) {
          return sutta;
        }
        sutta = {};

        assert(lang == null || typeof lang === "string");

        // Load Pali first as main segment reference
        let pliBilaraPath = this.bilaraPathOf({ sutta_uid, lang: "pli" });
        let { segments: pli = [] } =
          (await this.loadBilaraPath(pliBilaraPath)) || {};
        let segMap = Object.keys(pli).reduce((a, scid) => {
          a[scid] = { scid, pli: pli[scid] };
          return a;
        }, {});

        // Load translation segments
        let transBilaraPath = this.bilaraPathOf({ sutta_uid, lang, author });
        //assert(transBilaraPath,
        //`bilaraPathOf(${JSON.stringify({suttaRef, sutta_uid, lang, author})}`);
        let translation = transBilaraPath
          ? await this.loadBilaraPath(transBilaraPath)
          : {};
        let [transRoot, transLang] =
          (transBilaraPath && transBilaraPath.split("/")) || [];
        let { translator, segments: langSegs = [] } = translation;
        Object.keys(langSegs).forEach((scid) => {
          segMap[scid] = segMap[scid] || { scid };
          segMap[scid][transLang] = langSegs[scid];
        });

        // Load segments from reference language document
        if (refLang) {
          let refBilaraPath = this.bilaraPathOf({ sutta_uid, lang: refLang });
          let reference = refBilaraPath
            ? await this.loadBilaraPath(refBilaraPath)
            : {};
          let { translator: refAuthor, segments: refSegs = [] } = reference;
          sutta.refAuthor = refAuthor;
          Object.keys(refSegs).forEach((scid) => {
            segMap[scid] = segMap[scid] || { scid };
            segMap[scid].ref = refSegs[scid];
          });
        }

        let segments = Object.keys(segMap)
          .sort(SuttaCentralId.compareLow)
          .map((scid) => segMap[scid]);
        segments = this.highlightExamples({ segments, lang });
        let titleSegs = [];
        for (let s of segments) {
          if (!s.scid.includes(":0")) {
            break;
          }
          titleSegs.push(s);
        }
        let titles = titleSegs.map((s) => s[lang] || s.pli || "");
        sutta = suttaCache[key] = Object.assign(sutta, {
          sutta_uid,
          lang: transLang,
          author: translator,
          titles,
          segments,
        });
        Object.defineProperty(sutta, "translator", 
          { value: translator }); // deprecated
        return sutta;
      } catch (e) {
        this.warn(`loadSuttaRef(${suttaRef}) ${url}`, e.message);
        throw e;
      }
    }

    async voices() {
      return VOICES;
    }

    langDefaultVoice(lang = "en") {
      return VOICES.filter((v) => v.langTrans === lang)[0];
    }

    parseSuttaRef(suttaRef, defaultLang = this.lang) {
      if (typeof suttaRef === "string") {
        let { suids } = this;
        let refLower = suttaRef.toLowerCase();
        let [ref, segnum] = refLower.split(":");
        let [sutta_uid, lang = defaultLang, author] = ref
          .replace(/ /gu, "")
          .split("/");
        let { compareLow, compareHigh } = SuttaCentralId;
        let keys = suids.filter((k) => {
          return (
            compareLow(k, sutta_uid) <= 0 && compareHigh(sutta_uid, k) <= 0
          );
        });
        if (keys.length === 1) {
          return {
            sutta_uid: keys[0],
            lang,
            author,
            segnum,
          };
        }
      } else if (suttaRef) {
        let parsed = this.parseSuttaRef(
          suttaRef.sutta_uid,
          suttaRef.lang || defaultLang
        );
        let { sutta_uid, lang, author, segnum } = parsed || {};
        return {
          sutta_uid,
          lang,
          author: author || suttaRef.author || suttaRef.translator,
          segnum: segnum || suttaRef.segnum,
        };
      }

      return null;
    }

    async segmentAudioUrls(opts = {}) {
      let {
        scid,
        lang = "en",
        translator = "sujato",
        vtrans = "amy",
        vroot = "aditi",
      } = opts;
      if (!scid) {
        throw new Error("segmentAudioUrls() required: scid");
      }
      let { fetch, endpoints } = this;
      let suid = scid.split(":")[0];
      let url = [
        endpoints.playSegment,
        suid,
        lang,
        translator,
        scid,
        vtrans,
        vroot,
      ].join("/");

      try {
        var res = await fetch(url);
        var json = await res.json();
        var audio = json.segment.audio;
      } catch (e) {
        console.error(`HTTP${res.status} ${url}`, e.message);
        throw e;
      }

      let result = Object.keys(audio).reduce((a, k) => {
        if (k !== "vnameTrans") {
          let prefix = [endpoints.audio, suid, k];
          a[k] = [endpoints.audio, suid, k]
            .concat(
              k === "pli"
                ? ["ms", vroot, audio[k]]
                : [translator, vtrans, audio[k]]
            )
            .join("/");
        }
        return a;
      }, {});
      return result;
    }
  }

  module.exports = exports.BilaraWeb = BilaraWeb;
})(typeof exports === "object" ? exports : (exports = {}));

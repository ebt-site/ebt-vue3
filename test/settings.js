(typeof describe === 'function') && describe("settings", function() {
    const should = require("should");
    const {
        Settings,
    } = require("../src/index");

    it("default ctor", async()=>{
        var ebt = new Settings();
        should(ebt).properties({
            audio: Settings.AUDIO.OGG,
            iCursor: 0,
            fullLine: false,
            history: [],
            ips: 6,
            lang: 'en',
            maxResults: 5,
            maxHistory: 2000,  // half a cookie
            refLang: 'en',
            saveSettings: false,
            saveSettingsExamples: false,
            search: null,
            showId: false,
            showPali: true,
            showReference: false,
            showTrans: true,
            vnameRoot: 'Aditi',
            vnameTrans: 'Amy',

        });
    });
    it("custom ctor", async()=>{
        let dates = [ 
            new Date(2021, 1, 1),
            new Date(2021, 2, 2),
            new Date(2021, 3, 3),
        ];
        let history = dates.map(d=>({date:d}));
        let maxHistory = 1000;
        let showId = true;
        let showPali = false;
        var ebt = new Settings({
            history,
            maxHistory,
            showId,
            showPali,
        });

        should.deepEqual(ebt.history, history);
        should(ebt.history).not.equal(history);

        should(ebt).properties({
            maxHistory,
            showId,
            showPali,
            history,
        });
    });
    it("stringify() fits a cookie", ()=>{
        let dates = [ 
            new Date(2021, 1, 1),
            new Date(2021, 2, 2),
            new Date(2021, 3, 3),
        ];
        let history = dates.map(d=>({date:d}));
        let json1 = JSON.parse(JSON.stringify({history}));

        // ctor doesn't change options
        should(typeof json1.history[0].date).equal('string');
        var ebt = new Settings(json1);
        should(typeof json1.history[0].date).equal('string');

        // toJSON() truncates history as needed
        let cookie = JSON.stringify(ebt);
        should(cookie.length).below(4000); 
        let json2 = JSON.parse(cookie);
        let settings2 = new Settings(json2);
        should.deepEqual(settings2.history, history);
    });
    it("REF_LANGUAGES => reference languages", ()=>{
        should.deepEqual(Settings.REF_LANGUAGES.map(tl=>tl.code).sort(), [
            'de',
            'en',
        ]);
    });
    it("TRANS_LANGUAGES => translation languages", ()=>{
        should.deepEqual(Settings.TRANS_LANGUAGES.map(tl=>tl.code).sort(), [
            'cs',
            'de',
            'en',
            'ja',
            'pt',
        ]);
    });

});


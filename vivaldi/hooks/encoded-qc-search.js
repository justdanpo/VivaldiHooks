// Encode URL when searching from QC

vivaldi.jdhooks.hookClass('quickCommands_QuickCommandSearch', cls => {
    const engines_store = vivaldi.jdhooks.require('_SearchEnginesStore');
    const getLocalizedMessage = vivaldi.jdhooks.require('_getLocalizedMessage');
    class newCls extends cls {
        constructor(...e) {
            super(...e);

            this.getKeywordSearch = query => {
                const items = [];
                const engine = query.length > 0 && query.indexOf(" ") >= 1
                    ? engines_store.a.getByQuery(query)
                    : null;
                if (engine) {
                    let str = query.trim();
                    str = str.substring(str.indexOf(" "), str.length).trim();
                    str = str.replace(/ +/g, " ");
                    const val = engine.url.replace(/%s/gi, encodeURIComponent(str));
                    items.push({
                        id: engine.name,
                        name: getLocalizedMessage("Keyword Search “$1” on $2", [str.trim(), engine.name]),
                        url: "",
                        nickname: engine.keyword,
                        type: 'keywordSearch', // jdhooks.require(50).j
                        imageUrl: engine.faviconUrl,
                        searchString: query,
                        command: "fixed",
                        value: val
                    });
                }
                return items;
            }
        }
    }
    return newCls;
});

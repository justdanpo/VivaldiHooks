// Encode URL when searching from QC (fix for VB-59967)

vivaldi.jdhooks.hookClass('quickCommands_QuickCommandSearch', cls => {
    const engines_store = vivaldi.jdhooks.require('_SearchEnginesStore')
    return class extends cls {
        constructor(...e) {
            super(...e)

            const oldGKS = this.getKeywordSearch
            this.getKeywordSearch = query => {
                const items = oldGKS(query)
                if (items && items.length) {
                    const engine = query.length > 0 && query.indexOf(" ") >= 1
                        ? engines_store.a.getByQuery(query)
                        : null
                    if (engine) {
                        let str = query.trim()
                        str = str.substring(str.indexOf(" "), str.length).trim()
                        str = str.replace(/ +/g, " ")
                        str = engine.url.replace(/%s/gi, encodeURIComponent(str))
                        items[0].value = str
                    }
                }
                return items
            }
        }
    }
})

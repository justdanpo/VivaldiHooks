//Drag-n-drop text to tabstrip for search

vivaldi.jdhooks.hookClass("tabs_TabStrip", oldClass => {
    const SearchEnginesStore = vivaldi.jdhooks.require("_SearchEnginesStore")
    const WindowStore = vivaldi.jdhooks.require("_WindowStore")
    const UrlFieldActions = vivaldi.jdhooks.require("_UrlFieldActions")

    return class extends oldClass {
        constructor(...e) {
            super(...e)

            const old_onDropHandler = this.onDropHandler
            this.onDropHandler = event => {
                const tabs = event.dataTransfer.getData("vivaldi/x-tab-entries")
                const urls = event.dataTransfer.getData("text/uri-list")
                const text = event.dataTransfer.getData("text/plain")

                if (text && !tabs && !urls) {
                    event.preventDefault()
                    event.stopPropagation()

                    const searchEngine = SearchEnginesStore.getDefault(WindowStore.isIncognito())
                    if (text && searchEngine) {
                        UrlFieldActions.goSearchURL(text, {
                            inCurrent: false,
                            inBackground: false,
                            useSearchEngine: searchEngine,
                            post: searchEngine.post
                        })
                    }

                    return
                }
                old_onDropHandler(event)
            }
        }
    }
})

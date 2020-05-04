//Click active tab to scroll, click again to restore scroll position. Overrides "Minimize Active Tab".

vivaldi.jdhooks.hookClass("tabs_Tab", oldClass => {
    const WebViewStore = vivaldi.jdhooks.require("_WebViewStore")
    const PrefsCache = vivaldi.jdhooks.require("PrefsCache")
    const PrefKeys = vivaldi.jdhooks.require("_PrefKeys")

    return class extends oldClass {
        constructor(...e) { super(...e) }

        render() {
            let r = super.render()
            if (!r) return r
            r.props.onMouseDown = (evt) => {
                if (evt.button == 0 && this.props.active) {
                    const wv = WebViewStore.getActiveWebView()
                    if (wv) {
                        //Smooth scrolling doesn't work well as you may lost scroll position while scrolling
                        //const scroll = PrefsCache.get(PrefKeys.kWebpagesSmoothScrollingEnabled) ? "smooth" : "auto";
                        const scroll = "auto"

                        function scrollFn(scroll) {
                            window.scrollTo(
                                {
                                    ...window.scrollY
                                        ? (window.__jdoldscroll = window.scrollY, { top: 0 })
                                        : window.__jdoldscroll
                                            ? { top: window.__jdoldscroll }
                                            : {},
                                    ...{ behavior: scroll }
                                })
                        }

                        wv.executeScript({ code: "(" + scrollFn + `)('${scroll}')` })

                        evt.stopPropagation()
                        evt.preventDefault()
                    }
                }
            }
            return r
        }
    }
})

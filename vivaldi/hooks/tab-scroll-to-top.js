//Click active tab to scroll, click again to restore scroll position. Disable "Minimize Active Tab".

vivaldi.jdhooks.hookClass("tabs_TabStrip", oldClass => {
    const WebViewStore = vivaldi.jdhooks.require("_WebViewStore")
    const PrefsCache = vivaldi.jdhooks.require("PrefsCache")
    const PrefKeys = vivaldi.jdhooks.require("_PrefKeys")

    return class extends oldClass {
        constructor(...e) {
            super(...e)

            const old_handleMouseUp = this.handleMouseUp
            this.handleMouseUp = (event) => {
                if (event instanceof MouseEvent &&
                    !this.state.isDragging && this.state.draggedActive && this.state.draggedActive.active
                ) {
                    const wv = WebViewStore.getActiveWebView()
                    if (wv) {
                        //Smooth scrolling doesn't work well as you may lost scroll position while scrolling
                        //const scroll = PrefsCache.get(PrefKeys.kWebpagesSmoothScrollingEnabled) ? "smooth" : "auto"
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
                    }
                }

                old_handleMouseUp()
            }
        }
    }
})

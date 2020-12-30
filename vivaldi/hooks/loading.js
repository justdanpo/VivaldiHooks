//Tabload progress indicator with no delay.

{
    function isinternalurl(u) {
        const t = vivaldi.jdhooks.require("url").parse(u)
        return ["vivaldi:", "chrome:", "chrome-extension:"]
            .some(proto => t.protocol && 0 === proto.indexOf(t.protocol))
    }

    vivaldi.jdhooks.hookClass("progress_PageloadProgress", cls => {
        const NavigationInfo = vivaldi.jdhooks.require("_NavigationInfo")
        const PageStore = vivaldi.jdhooks.require("_PageStore")

        class progress extends cls {
            constructor(...e) {
                super(...e)

                let old_onProgressStateStoreChanged = this._onProgressStateStoreChanged
                this._onProgressStateStoreChanged = () => {
                    const pageid = this.props.pageId
                    const page = PageStore.getPageById(pageid)
                    const navinfo = NavigationInfo.getNavigationInfo(pageid) || {}
                    const trigger = navinfo.trigger
                    if (page && page.pendingUrl && !isinternalurl(page.pendingUrl)) {
                        const pageChanging = (trigger == "stop") && (page.pendingUrl != page.url)
                        if (pageChanging || trigger == "start") {
                            this.setState(
                                {
                                    currentPageId: pageid,
                                    stopped: false,
                                    progress: 0,
                                    isProgressing: true,
                                    isStarted: true
                                }
                            )
                            return
                        }
                    }
                    old_onProgressStateStoreChanged()
                }
            }

            render() {
                const page = PageStore.getPageById(this.props.pageId)
                if (page) {
                    this.props.open = !isinternalurl(page.pendingUrl || page.url)
                }
                return super.render()
            }
        }

        return progress
    })

    vivaldi.jdhooks.hookClass("tabs_Tab", oldClass => {
        const ProgressInfo = vivaldi.jdhooks.require("_ProgressInfo")

        class loadingFavicon extends oldClass {
            constructor(...e) {
                super(...e)
                //TODO: init state?
                const old_onProgressStateStoreChanged = this._onProgressStateStoreChanged
                this._onProgressStateStoreChanged = () => {
                    if (!isinternalurl(this.props.url)) {
                        const progressInfo = ProgressInfo.getProgressInfo(this.props.pageId)
                        if (progressInfo) {
                            this.setState({ loadingProgress: progressInfo.progress })
                            return
                        }
                    }

                    old_onProgressStateStoreChanged()
                }
            }
        }

        return loadingFavicon
    })

    vivaldi.jdhooks.hookModuleExport("setProgressState", "default", exports => {
        const ProgressInfo = vivaldi.jdhooks.require("_ProgressInfo")

        class newClass extends exports {
            static setProgressState(pageId, progressState) {
                const oldProgressInfo = ProgressInfo.getProgressInfo(pageId)
                if (oldProgressInfo) {
                    if (oldProgressInfo.progress > progressState.progress
                    ) {
                        if (oldProgressInfo.jd_allow_override_progress ||
                            oldProgressInfo.url != progressState.url
                        ) {
                            oldProgressInfo.progress = progressState.progress
                            oldProgressInfo.jd_allow_override_progress = false
                        }
                    }
                }
                return exports.setProgressState(pageId, progressState)
            }
        }
        return newClass
    })

    vivaldi.jdhooks.hookClass("webpage_WebPageContent", oldClass => {
        const ProgressInfo = vivaldi.jdhooks.require("_ProgressInfo")

        class newClass extends oldClass {
            constructor(...e) {
                super(...e)

                function allowOverride(id) {
                    const progressInfo = ProgressInfo.getProgressInfo(id)
                    if (progressInfo) progressInfo.jd_allow_override_progress = true
                }

                const old_handleLoadStop = this.handleLoadStop
                this.handleLoadStop = e => {
                    allowOverride(this.props.id)
                    return old_handleLoadStop(e)
                }

                const old_handleLoadStart = this.handleLoadStart
                this.handleLoadStart = e => {
                    allowOverride(this.props.id)
                    return old_handleLoadStart(e)
                }

                const old_handleLoadAbort = this.handleLoadAbort
                this.handleLoadAbort = e => {
                    allowOverride(this.props.id)
                    return old_handleLoadAbort(e)
                }
            }
        }
        return newClass
    })
}

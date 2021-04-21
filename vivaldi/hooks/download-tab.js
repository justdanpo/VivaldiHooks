//Open Download Tab instead of Download Panel
//Открывать загрузки во вкладке, а не в панели

{
    vivaldi.jdhooks.hookModuleExport("vivaldiSettings", "default", exports => {
        let oldGetDefault = exports.getDefault
        exports.getDefault = name => {
            switch (name) {
                case "SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS": return false
                default: return oldGetDefault(name)
            }
        }
        return exports
    })

    vivaldi.jdhooks.hookClass("settings_downloads_Downloads", oldClass => {
        const React = vivaldi.jdhooks.require("React")
        const VivaldiSettings = vivaldi.jdhooks.require("vivaldiSettings")

        const Setting = vivaldi.jdhooks.insertWatcher(class extends React.PureComponent {
            render() {
                return React.createElement("div", { className: "setting-single" },
                    React.createElement("label", null,
                        React.createElement("input", {
                            type: "checkbox",
                            checked: this.state.jdVivaldiSettings.SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS,
                            onChange: () => VivaldiSettings.set({
                                SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS: !this.state.jdVivaldiSettings.SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS
                            })
                        }),
                        React.createElement("span", null, "Open downloads in new tab instead of panel")
                    )
                )
            }
        }, { settings: ["SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS"] })

        class newDownloadSettings extends oldClass {
            render() {
                let r = super.render()
                r.props.children.props.children.push(React.createElement(Setting, {}))
                return r
            }
        }
        return newDownloadSettings
    })

    function openDownloadTab() {
        const downloadTabPageStore = vivaldi.jdhooks.require("_PageStore")

        if (!downloadTabPageStore.getPages().find(page => page.get("url") === "chrome://downloads/")) {
            vivaldi.jdhooks.require("PageActions").openURL("vivaldi://downloads", {
                singleton: true,
                inBackground: true,
                isTyped: false
            })
        }
    }

    vivaldi.jdhooks.hookClass("webpage_WebPageContent", oldClass => {
        const PrefCache = vivaldi.jdhooks.require("PrefsCache")
        const PrefKeys = vivaldi.jdhooks.require("_PrefKeys")

        class downloadTabWebpageContent extends oldClass {
            constructor(...e) {
                super(...e)

                const old_handleOnPermissionRequest = this.handleOnPermissionRequest
                this.handleOnPermissionRequest = (evt => {
                    if (evt.permission == "download"
                        && PrefCache.get(PrefKeys.kDownloadsStartAutomatically)
                        && PrefCache.get(PrefKeys.kDownloadsOpenPanelOnNew)
                        && this.state.jdVivaldiSettings.SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS
                    ) {
                        evt.preventDefault()
                        evt.request.allow()
                        openDownloadTab()
                        return
                    }
                    return old_handleOnPermissionRequest(evt)
                })
            }
        }
        return vivaldi.jdhooks.insertWatcher(downloadTabWebpageContent, { settings: ["SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS"] })
    })

    vivaldi.jdhooks.hookClass("dialogs_downloadDialog", oldClass => {
        const VivaldiSettings = vivaldi.jdhooks.require("vivaldiSettings")
        const PrefCache = vivaldi.jdhooks.require("PrefsCache")
        const PrefKeys = vivaldi.jdhooks.require("_PrefKeys")

        class downloadTabDownloadDialog extends oldClass {
            constructor(...e) {
                super(...e)

                function doCommon(oldFn, ...e) {
                    if (PrefCache.get(PrefKeys.kDownloadsOpenPanelOnNew) &&
                        VivaldiSettings.getSync("SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS")
                    ) {
                        this.props.customData.request.allow(...e)
                        this.setState(e => ({ shown: !e.shown }))
                        openDownloadTab()
                        this.close()
                    } else {
                        oldFn()
                    }
                }

                const old_onOpen = this.onOpen
                this.onOpen = () => doCommon.bind(this)(old_onOpen, "open")
                const old_onSave = this.onSave
                this.onSave = () => doCommon.bind(this)(old_onSave)
                const old_onSaveAs = this.onSaveAs
                this.onSaveAs = () => doCommon.bind(this)(old_onSaveAs, "saveas")
            }
        }

        return downloadTabDownloadDialog
    })
}

//Open Download Tab instead of Download Panel
//Открывать загрузки во вкладке, а не в панели

{
    vivaldi.jdhooks.hookModule("vivaldiSettings", (moduleInfo, exports) => {
        let oldGetDefault = exports.getDefault
        exports.getDefault = name => {
            switch (name) {
                case "SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS": return false
                default: return oldGetDefault(name)
            }
        }
        return exports
    })

    class SettingsWatcher {
        constructor(memberName, keys) {
            this.memberName = memberName
            this.keys = keys
            this.VivaldiSettings = undefined
        }
        ctr(obj) {
            if (!this.VivaldiSettings) this.VivaldiSettings = vivaldi.jdhooks.require("vivaldiSettings")
            if (!obj.state) obj.state = {}
            obj.state[this.memberName] = this.VivaldiSettings.getKeysSync(this.keys)
        }
        changeHandler(obj) {
            return (oldValue, newValue, key) => {
                obj.setState(state => ({ [this.memberName]: { ...state[this.memberName], [key]: newValue } }))
            }
        }
        cdm(obj) {
            this.keys.forEach(key => this.VivaldiSettings.addListener(key, this.changeHandler(obj)))
        }
        cwu(obj) {
            this.keys.forEach(key => this.VivaldiSettings.removeListener(key, this.changeHandler(obj)))
        }
    }

    let watcher = new SettingsWatcher("dlTabSettings", ["SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS"])

    vivaldi.jdhooks.hookClass("settings_downloads_Downloads", oldClass => {
        const React = vivaldi.jdhooks.require("React")
        const VivaldiSettings = vivaldi.jdhooks.require("vivaldiSettings")

        class newDownloadSettings extends oldClass {
            constructor(...e) {
                super(...e)
                watcher.ctr(this)
            }

            componentDidMount() {
                if (super.componentDidMount) super.componentDidMount()
                watcher.cdm(this)
            }

            componentWillUnmount() {
                watcher.cwu(this)
                if (super.componentWillUnmount) super.componentWillUnmount()
            }

            render() {
                let r = super.render()
                console.log("dl settings", this, r)
                r.props.children.props.children.push(
                    React.createElement("div", { className: "setting-single" },
                        React.createElement("label", null,
                            React.createElement("input", {
                                type: "checkbox",
                                checked: this.state.dlTabSettings.SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS,
                                onChange: () => VivaldiSettings.set({
                                    SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS: !this.state.dlTabSettings.SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS
                                })
                            }),
                            React.createElement("span", null, "Open downloads in new tab instead of panel")
                        )
                    ))
                return r
            }
        }
        return newDownloadSettings
    })

    function openDownloadTab() {
        var downloadTabPageStore = vivaldi.jdhooks.require("_PageStore");

        if (!downloadTabPageStore.getPages().find(page => page.get("url") === "chrome://downloads/")) {
            vivaldi.jdhooks.require("PageActions").openURL("vivaldi://downloads", {
                singleton: true,
                inBackground: true,
                isTyped: false
            })
        }
    };

    vivaldi.jdhooks.hookClass("webpage_WebPageContent", oldClass => {
        const PrefCache = vivaldi.jdhooks.require("PrefsCache")
        const PrefKeys = vivaldi.jdhooks.require("_PrefKeys")

        class downloadTabWebpageContent extends oldClass {
            constructor(...e) {
                super(...e)

                const old_handleOnPermissionRequest = this.handleOnPermissionRequest
                this.handleOnPermissionRequest = ((evt) => {
                    if (evt.permission == "download"
                        && PrefCache.get(PrefKeys.kDownloadsStartAutomatically)
                        && PrefCache.get(PrefKeys.kDownloadsOpenPanelOnNew)
                        && this.props.vivaldiSettings.SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS
                    ) {
                        evt.request.allow()
                        openDownloadTab()
                    }
                    return old_handleOnPermissionRequest(evt)
                })
            }
        }
        return downloadTabWebpageContent
    }, { settings: ["SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS"] })

    vivaldi.jdhooks.hookClass("dialogs_downloadDialog", oldClass => {
        const VivaldiSettings = vivaldi.jdhooks.require("vivaldiSettings")

        class downloadTabDownloadDialog extends oldClass {
            constructor(...e) {
                super(...e)

                function doCommon(oldFn, ...e) {
                    if (VivaldiSettings.getSync("SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS")) {
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

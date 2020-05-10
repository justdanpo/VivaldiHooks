//GO buttons in addressbar
//Кнопки перехода для адресной и посковой строк

vivaldi.jdhooks.hookModule("vivaldiSettings", (moduleInfo, exports) => {
    let oldGetDefault = exports.getDefault
    exports.getDefault = name => {
        switch (name) {
            case "ADDRESS_BAR_URL_GO_ENABLED": return true
            case "ADDRESS_BAR_SEARCH_GO_ENABLED": return true
            default: return oldGetDefault(name)
        }
    }
    return exports
})

vivaldi.jdhooks.hookClass("urlfield_UrlBar", oldClass => {
    const React = vivaldi.jdhooks.require("React")
    const ToolbarButton = vivaldi.jdhooks.require("toolbars_ToolbarButton")

    //TODO: switch to hookModule wrapping urlfield_UrlBar with common_InsertVivaldiSettings in the future
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

    let watcher = new SettingsWatcher("gobuttonSettings", ["ADDRESS_BAR_URL_GO_ENABLED", "ADDRESS_BAR_SEARCH_GO_ENABLED"])

    const buttonImage = '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M 12,4 10.400391,5.5996094 16.5,11.869141 l -13.5,0 0,2.261718 13.5,0 -6.099609,6.269532 L 12,22 21,13 12,4 Z"></path></svg>'

    function btn(onclick) {
        return React.createElement(ToolbarButton, {
            tooltip: "Go!",
            onClick: onclick,
            onMiddleClick: onclick,
            image: buttonImage,
        })
    }

    class newUrlBar extends oldClass {
        constructor(...e){
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
            if (this.state.gobuttonSettings.ADDRESS_BAR_URL_GO_ENABLED) {
                const idx = r.props.children.findIndex(x => x && (x.props.className == "addressfield"))
                if (idx > -1) r.props.children.splice(idx + 1, 0,
                    btn((evt) =>
                        this.handleUrlFieldSubmit({
                            url: this.state.editUrl || this.props.url,
                            options: { inCurrent: evt.button !== 1 }
                        })
                    ))
            }

            if (this.state.gobuttonSettings.ADDRESS_BAR_SEARCH_GO_ENABLED) {
                const idx = r.props.children.findIndex(x => x && (x.ref == "searchField"))
                if (idx > -1) r.props.children.splice(idx + 1, 0,
                    btn((evt) =>
                        this.onSearch(
                            this.refs.searchField.state.editText,
                            this.refs.searchField.state.currentSearchEngine,
                            { inCurrent: evt.button !== 1 }
                        )
                    ))
            }

            return r
        }
    }

    return newUrlBar
})

vivaldi.jdhooks.hookClass("settings_addressbar_AddressBar", oldClass => {
    const React = vivaldi.jdhooks.require("React")
    const Settings_SettingsSearchCategoryChild = vivaldi.jdhooks.require("settings_SettingsSearchCategoryChild")
    const VivaldiSettings = vivaldi.jdhooks.require("vivaldiSettings")
    const common_InsertVivaldiSettings = vivaldi.jdhooks.require("common_InsertVivaldiSettings")

    const Setting = common_InsertVivaldiSettings(class extends React.PureComponent {
        render() {
            return React.createElement(Settings_SettingsSearchCategoryChild, { filter: this.props.filter },
                React.createElement("h3", null, "Go button"),
                React.createElement("div", { className: "setting-group" },
                    React.createElement("div", { className: "setting-single" },
                        React.createElement("label", null,
                            React.createElement("input", {
                                type: "checkbox",
                                checked: this.props.vivaldiSettings.ADDRESS_BAR_URL_GO_ENABLED,
                                onChange: () => VivaldiSettings.set({
                                    ADDRESS_BAR_URL_GO_ENABLED: !this.props.vivaldiSettings.ADDRESS_BAR_URL_GO_ENABLED
                                })
                            }),
                            React.createElement("span", null, "Go button after addressfield")
                        )
                    ),
                    React.createElement("div", { className: "setting-single" },
                        React.createElement("label", null,
                            React.createElement("input", {
                                type: "checkbox",
                                checked: this.props.vivaldiSettings.ADDRESS_BAR_SEARCH_GO_ENABLED,
                                onChange: () => VivaldiSettings.set({
                                    ADDRESS_BAR_SEARCH_GO_ENABLED: !this.props.vivaldiSettings.ADDRESS_BAR_SEARCH_GO_ENABLED
                                })
                            }),
                            React.createElement("span", null, "Go button after searchfield")
                        )
                    )
                )
            )
        }
    }, ["ADDRESS_BAR_URL_GO_ENABLED", "ADDRESS_BAR_SEARCH_GO_ENABLED"])


    return class extends oldClass {
        render() {
            let r = super.render()
            r.props.children.push(React.createElement(Setting, this.props))
            return r
        }
    }
})

//GO buttons in addressbar
//Кнопки перехода для адресной и посковой строк

vivaldi.jdhooks.hookModuleExport("vivaldiSettings", "default", exports => {
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

    function btn(onclick) {
        const buttonImage = '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M 12,4 10.400391,5.5996094 16.5,11.869141 l -13.5,0 0,2.261718 13.5,0 -6.099609,6.269532 L 12,22 21,13 12,4 Z"></path></svg>'
        return React.createElement(ToolbarButton, {
            tooltip: "Go!",
            onClick: onclick,
            onMiddleClick: onclick,
            image: buttonImage,
        })
    }

    class newUrlBar extends oldClass {
        render() {
            let r = super.render()

            const idxAddressField = r.props.children.findIndex(x => x && (x.props.className == "UrlBar-AddressField"))
            if (idxAddressField > -1) r.props.children.splice(idxAddressField + 1, 0,
                this.state.jdVivaldiSettings.ADDRESS_BAR_URL_GO_ENABLED
                    ? btn((evt) =>
                        this.handleUrlFieldSubmit({
                            url: this.state.editUrl || this.props.url,
                            options: { inCurrent: evt.button !== 1 }
                        }))
                    : null
            )

            const idxSearchField = r.props.children.findIndex(x => x && (x.ref == "searchField"))
            if (idxSearchField > -1) r.props.children.splice(idxSearchField + 1, 0,
                this.state.jdVivaldiSettings.ADDRESS_BAR_SEARCH_GO_ENABLED
                    ? btn((evt) =>
                        this.onSearch(
                            this.refs.searchField.state.editText,
                            this.refs.searchField.state.currentSearchEngine,
                            { inCurrent: evt.button !== 1 }
                        )
                    )
                    : null
            )

            return r
        }
    }

    return vivaldi.jdhooks.insertWatcher(newUrlBar, { settings: ["ADDRESS_BAR_URL_GO_ENABLED", "ADDRESS_BAR_SEARCH_GO_ENABLED"] })
})

vivaldi.jdhooks.hookClass("settings_addressbar_AddressBar", oldClass => {
    const React = vivaldi.jdhooks.require("React")
    const Settings_SettingsSearchCategoryChild = vivaldi.jdhooks.require("settings_SettingsSearchCategoryChild")
    const VivaldiSettings = vivaldi.jdhooks.require("vivaldiSettings")

    const Setting = vivaldi.jdhooks.insertWatcher(class extends React.PureComponent {
        render() {
            return React.createElement(Settings_SettingsSearchCategoryChild, { filter: this.props.filter },
                React.createElement("h3", null, "Go button"),
                React.createElement("div", { className: "setting-group" },
                    React.createElement("div", { className: "setting-single" },
                        React.createElement("label", null,
                            React.createElement("input", {
                                type: "checkbox",
                                checked: this.state.jdVivaldiSettings.ADDRESS_BAR_URL_GO_ENABLED,
                                onChange: () => VivaldiSettings.set({
                                    ADDRESS_BAR_URL_GO_ENABLED: !this.state.jdVivaldiSettings.ADDRESS_BAR_URL_GO_ENABLED
                                })
                            }),
                            React.createElement("span", null, "Go button after addressfield")
                        )
                    ),
                    React.createElement("div", { className: "setting-single" },
                        React.createElement("label", null,
                            React.createElement("input", {
                                type: "checkbox",
                                checked: this.state.jdVivaldiSettings.ADDRESS_BAR_SEARCH_GO_ENABLED,
                                onChange: () => VivaldiSettings.set({
                                    ADDRESS_BAR_SEARCH_GO_ENABLED: !this.state.jdVivaldiSettings.ADDRESS_BAR_SEARCH_GO_ENABLED
                                })
                            }),
                            React.createElement("span", null, "Go button after searchfield")
                        )
                    )
                )
            )
        }
    }, { settings: ["ADDRESS_BAR_URL_GO_ENABLED", "ADDRESS_BAR_SEARCH_GO_ENABLED"] })


    return class extends oldClass {
        render() {
            let r = super.render()
            r.props.children.push(React.createElement(Setting, this.props))
            return r
        }
    }
})

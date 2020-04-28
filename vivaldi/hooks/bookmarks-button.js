//Bookmarks button before AddressBar
//Кнопка с выпадающими закладками перед строкой адреса

{
    const position = { separate: "separate", addressfield: "addressfield" }

    vivaldi.jdhooks.hookModule("_VivaldiSettings", (moduleInfo, exports) => {
        let oldGetDefault = exports.getDefault
        exports.getDefault = name => {
            switch (name) {
                case "BOOKMARK_BUTTON_POSITION": return position.separate
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
            if (!this.VivaldiSettings) this.VivaldiSettings = vivaldi.jdhooks.require("_VivaldiSettings")
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

    let watcher = new SettingsWatcher("bbSettings", ["BOOKMARK_BUTTON_POSITION", "VIVALDI_MENU_POSITION"])

    function bookmarksOnClick(event) {
        const CommandManager = vivaldi.jdhooks.require("_CommandManager")
        const ShowMenu = vivaldi.jdhooks.require("_ShowMenu")

        let menu = CommandManager.getNamedMenu("vivaldi", true)
        let idx = menu.findIndex(i => i.labelEnglish == "Bookmarks")
        if (idx > -1) {
            const rect = event.target.getBoundingClientRect()
            const props = {
                id: 0,
                rect: {
                    x: parseInt(rect.left),
                    y: parseInt(rect.top),
                    width: parseInt(rect.width),
                    height: parseInt(rect.height)
                },
                menu: { items: menu[idx].items }
            }
            ShowMenu.show(props.id, [props], "bottom")
        }
    }

    vivaldi.jdhooks.hookClass("createbookmark_createbookmark", origClass => {
        const ReactDom = vivaldi.jdhooks.require("ReactDOM")

        class newCreateBookmarkButton extends origClass {
            constructor(...e) {
                super(...e)
                watcher.ctr(this)
            }

            pointerUp(e) {
                if (e.button == 2 && this.state.bbSettings.BOOKMARK_BUTTON_POSITION == position.addressfield) {
                    bookmarksOnClick(e)
                }
            }

            componentDidMount() {
                if (super.componentDidMount) super.componentDidMount()
                watcher.cdm(this)

                const button = ReactDom.findDOMNode(this)
                if (button) button.addEventListener("pointerup", this.pointerUp.bind(this), true)
            }

            componentWillUnmount() {
                const button = ReactDom.findDOMNode(this)
                if (button) button.removeEventListener("pointerup", this.pointerUp, true)

                watcher.cwu(this)
                if (super.componentWillUnmount) super.componentWillUnmount()
            }
        }
        return newCreateBookmarkButton
    })

    vivaldi.jdhooks.hookClass("toolbars_Toolbar", origClass => {
        const React = vivaldi.jdhooks.require("React")
        const SettingsPaths = vivaldi.jdhooks.require("_PrefKeys")
        const ToolbarButton = vivaldi.jdhooks.require("toolbars_ToolbarButton")

        class newClass extends origClass {
            constructor(...e) {
                super(...e)
                watcher.ctr(this)
            }

            render() {
                let ret = super.render()
                if (this.props.name == SettingsPaths.kToolbarsNavigation &&
                    this.state.bbSettings.BOOKMARK_BUTTON_POSITION == position.separate &&
                    this.state.bbSettings.VIVALDI_MENU_POSITION != "top") {
                    ret.props.children.push(
                        React.createElement(ToolbarButton, {
                            tooltip: "Bookmarks",
                            onClick: bookmarksOnClick,
                            image: vivaldi.jdhooks.require("_svg_panel_bookmarks")
                        })
                    )
                }
                return ret
            }

            componentDidMount() {
                if (super.componentDidMount) super.componentDidMount()
                watcher.cdm(this)
            }

            componentWillUnmount() {
                watcher.cwu(this)
                if (super.componentWillUnmount) super.componentWillUnmount()
            }
        }
        return newClass
    })

    vivaldi.jdhooks.hookClass("settings_bookmarks_BookmarkBar", origClass => {
        const React = vivaldi.jdhooks.require("React")
        const RadioGroup = vivaldi.jdhooks.require("common_RadioGroup")
        const VivaldiSettings = vivaldi.jdhooks.require("_VivaldiSettings")

        class bookmarkButtonSettings extends origClass {
            constructor(...e) {
                super(...e)
                watcher.ctr(this)
            }

            render() {
                let r = super.render()
                r.props.children.push(
                    React.createElement("div", { className: "setting-group" },
                        React.createElement("h3", {}, "Bookmark Button"),
                        React.createElement(RadioGroup,
                            {
                                name: "bookmark_bar_display",
                                value: this.state.bbSettings.BOOKMARK_BUTTON_POSITION,
                                onChange: (evt) => VivaldiSettings.set({ BOOKMARK_BUTTON_POSITION: evt.target.value })
                            },
                            React.createElement("div", { className: "setting-single" },
                                React.createElement("label", {},
                                    React.createElement("input",
                                        {
                                            type: "radio",
                                            value: position.separate,
                                        }),
                                    React.createElement("span", {}, "Separate button")
                                )
                            ),
                            React.createElement("div", { className: "setting-single" },
                                React.createElement("label", {},
                                    React.createElement("input",
                                        {
                                            type: "radio",
                                            value: position.addressfield,
                                        }),
                                    React.createElement("span", {},
                                        'Right click on "Add bookmark" button in the address field'
                                    )
                                )
                            )
                        )
                    ))
                return r
            }

            componentDidMount() {
                if (super.componentDidMount) super.componentDidMount()
                watcher.cdm(this)
            }

            componentWillUnmount() {
                watcher.cwu(this)
                if (super.componentWillUnmount) super.componentWillUnmount()
            }
        }

        return bookmarkButtonSettings
    })

}
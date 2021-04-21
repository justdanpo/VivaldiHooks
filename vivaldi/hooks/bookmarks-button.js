//Bookmarks button before AddressBar
//Кнопка с выпадающими закладками перед строкой адреса

{
    const position = { separate: "separate", addressfield: "addressfield" }

    vivaldi.jdhooks.hookModuleExport("vivaldiSettings", "default", exports => {
        let oldGetDefault = exports.getDefault
        exports.getDefault = name => {
            switch (name) {
                case "BOOKMARK_BUTTON_POSITION": return position.separate
                default: return oldGetDefault(name)
            }
        }
        return exports
    })

    function bookmarksOnClick(event) {
        const CommandManager = vivaldi.jdhooks.require("_CommandManager")
        const ShowMenu = vivaldi.jdhooks.require("_ShowMenu")

        const menu = CommandManager.getNamedMenu("vivaldi", true)
            .concat(CommandManager.getNamedMenu("menubar", true))

        const bookmarks = menu.find(i => i.commandName == "MENU_BOOKMARKS")
        if (bookmarks) {
            const rect = event.target.getBoundingClientRect()
            const props = {
                id: 0,
                rect: {
                    x: parseInt(rect.left),
                    y: parseInt(rect.top),
                    width: parseInt(rect.width),
                    height: parseInt(rect.height)
                },
                menu: {
                    items: bookmarks.items,
                    expandId: "",
                    preferred: []
                }
            }
            ShowMenu.show(props.id, [props], "bottom")
        }
    }

    vivaldi.jdhooks.hookClass("createbookmark_createbookmark", origClass => {
        const ReactDom = vivaldi.jdhooks.require("ReactDOM")

        class newCreateBookmarkButton extends origClass {
            constructor(...e) {
                super(...e)
                this.bookmarksButtonJs = {
                    pointerUp: (e => {
                        if (e.button == 2 && this.state.jdVivaldiSettings.BOOKMARK_BUTTON_POSITION == position.addressfield) {
                            bookmarksOnClick(e)
                        }
                    }).bind(this)
                }
            }

            componentDidMount() {
                if (super.componentDidMount) super.componentDidMount()

                const button = ReactDom.findDOMNode(this)
                if (button) button.addEventListener("pointerup", this.bookmarksButtonJs.pointerUp, true)
            }

            componentWillUnmount() {
                const button = ReactDom.findDOMNode(this)
                if (button) button.removeEventListener("pointerup", this.bookmarksButtonJs.pointerUp, true)

                if (super.componentWillUnmount) super.componentWillUnmount()
            }
        }
        return vivaldi.jdhooks.insertWatcher(newCreateBookmarkButton, { settings: ["BOOKMARK_BUTTON_POSITION"] })
    })

    vivaldi.jdhooks.hookClass("toolbars_Toolbar", origClass => {
        const React = vivaldi.jdhooks.require("React")
        const SettingsPaths = vivaldi.jdhooks.require("_PrefKeys")
        const ToolbarButton = vivaldi.jdhooks.require("toolbars_ToolbarButton")

        class newClass extends origClass {
            render() {
                let ret = super.render()
                if (this.props.name == SettingsPaths.kToolbarsNavigation) {
                    ret.props.children.push(
                        this.state.jdVivaldiSettings.BOOKMARK_BUTTON_POSITION == position.separate &&
                            this.state.jdPrefs[SettingsPaths.kMenuDisplay] != "top"

                            ? React.createElement(ToolbarButton, {
                                tooltip: "Bookmarks",
                                onClick: bookmarksOnClick,
                                image: vivaldi.jdhooks.require("_svg_bookmarks_large")
                            })

                            : null
                    )
                }
                return ret
            }
        }
        return vivaldi.jdhooks.insertWatcher(newClass, {
            settings: ["BOOKMARK_BUTTON_POSITION"],
            prefs: [SettingsPaths.kMenuDisplay]
        })
    })

    vivaldi.jdhooks.hookClass("settings_bookmarks_BookmarkSettings", origClass => {
        const React = vivaldi.jdhooks.require("React")
        const RadioGroup = vivaldi.jdhooks.require("common_RadioGroup")
        const VivaldiSettings = vivaldi.jdhooks.require("vivaldiSettings")
        const Settings_SettingsSearchCategoryChild = vivaldi.jdhooks.require("settings_SettingsSearchCategoryChild")

        function toArray(i) {
            if (Array.isArray(i)) return i;
            return [i];
        }

        const Setting = vivaldi.jdhooks.insertWatcher(class extends React.PureComponent {
            render() {
                return React.createElement(Settings_SettingsSearchCategoryChild, { filter: this.props.filter },
                    React.createElement("div", { className: "setting-group" },
                        React.createElement("h3", {}, "Bookmark Button"),
                        React.createElement(RadioGroup,
                            {
                                name: "bookmark_button_position",
                                value: this.state.jdVivaldiSettings.BOOKMARK_BUTTON_POSITION,
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
                    )
                )
            }
        }, { settings: ["BOOKMARK_BUTTON_POSITION"] })

        return class extends origClass {
            render() {
                let r = super.render()
                r.props.children = toArray(r.props.children)
                r.props.children.push(React.createElement(Setting, this.props))
                return r
            }
        }
    })
}
//Settings: select hooks to load
//Настройки: выбор хуков для загрузки

vivaldi.jdhooks.addStyle(`
.hooks-startup-settings-description {
    margin-left: 2ch;
}
`, "jdhooks-startup-settings.js")

vivaldi.jdhooks.hookClass("settings_startup_StartupSettingsSection", oldClass => {
    const React = vivaldi.jdhooks.require("React")
    const settings = vivaldi.jdhooks.require("vivaldiSettings")
    const settings_SettingsSearchCategoryChild = vivaldi.jdhooks.require("settings_SettingsSearchCategoryChild")

    let newScripts = []

    class Section extends React.Component {
        setProperty(obj, name, value) {
            if (name in obj) Object.defineProperty(obj, name, { value: value, enumerable: true, configurable: true, writable: true }); else obj[name] = value
        }

        constructor(...e) {
            super(...e)

            let newState = {
                ...{
                    defaultLoad: false,
                    scripts: {},
                    scriptNames: []
                },
                ...settings.getSync(["JDHOOKS_STARTUP"])
            }

            let updated = false

            //remove deleted scripts from settings
            for (let script in newState.scripts) {
                if (!(script in vivaldi.jdhooks._hooks)) {
                    updated = true
                    delete newState.scripts[script]
                }
            }

            for (let script in vivaldi.jdhooks._hooks) {
                if (!(script in newState.scripts)) {
                    newState.scripts[script] = newState.defaultLoad
                    newScripts[script] = true
                    updated = true
                }
            }

            newState.scriptNames = Object.keys(newState.scripts)
            newState.scriptNames.sort((first, second) => first.localeCompare(second, { sensitivity: "accent" }))

            this.setProperty(this, "state", newState)
            if (updated) this.updateHookSettings()
        }

        updateHookSettings() {
            settings.set({ ["JDHOOKS_STARTUP"]: { "defaultLoad": this.state.defaultLoad, "scripts": this.state.scripts } })
        }

        toggleDefaultLoad() {
            this.setState({ defaultLoad: !this.state.defaultLoad }, () => this.updateHookSettings())
        }

        toggleScriptState(script) {
            let scripts = this.state.scripts
            scripts[script] = !scripts[script]
            this.setState({ "scripts": scripts }, () => this.updateHookSettings())
        }

        render() {
            return React.createElement(settings_SettingsSearchCategoryChild, { filter: this.props.filter },
                React.createElement("h2", null, "Hooks"),
                React.createElement("div", { className: "setting-group unlimited" },
                    React.createElement("div", { className: "setting-single" },
                        React.createElement("label", null,
                            React.createElement("input", {
                                type: "checkbox",
                                checked: this.state.defaultLoad,
                                onChange: this.toggleDefaultLoad.bind(this)
                            }),
                            React.createElement("span", null, "Startup mode for new items")
                        )
                    ),
                    React.createElement("div", {
                        className: "setting-group unlimited pad-top"
                    },
                        React.createElement("h3", null, "Load hook files"),
                        React.createElement("table", null,
                            this.state.scriptNames.map(script => {

                                const newLabel = !newScripts[script] ? null : React.createElement("span", {
                                    style: {
                                        color: "red",
                                        textShadow: "rgb(255, 255, 255) 0px 0px 0.2em, rgb(0,0, 0) 0px 0px 0.2em"
                                    }
                                }, " (NEW!)")

                                return React.createElement("tr", null,
                                    React.createElement("td", null,
                                        React.createElement("label", null,
                                            React.createElement("input",
                                                {
                                                    type: "checkbox",
                                                    checked: this.state.scripts[script] || script == "jdhooks-startup-settings.js",
                                                    onChange: this.toggleScriptState.bind(this, script),
                                                    disabled: script == "jdhooks-startup-settings.js"
                                                }),
                                            React.createElement("span", null,
                                                script,
                                                newLabel))
                                    ),
                                    React.createElement("td", null,
                                        React.createElement("label", { className: "hooks-startup-settings-description" },
                                            React.createElement("span", null, vivaldi.jdhooks._hookDescriptions[script])),
                                    )
                                )
                            })
                        )
                    )
                )
            )
        }
    }

    class newSettingsClass extends oldClass {
        render() {
            let r = super.render()

            r.props.children.push(React.createElement(Section, this.props))

            return r
        }
    }

    return newSettingsClass
})

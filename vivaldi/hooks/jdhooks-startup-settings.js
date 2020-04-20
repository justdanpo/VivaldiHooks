//Settings: select hooks to load
//Настройки: выбор хуков для загрузки

vivaldi.jdhooks.hookModule("settings_Settings", (moduleInfo, exports) => {
    const React = vivaldi.jdhooks.require("React")
    const settings = vivaldi.jdhooks.require("_VivaldiSettings")

    let newScripts = []

    class Section extends React.Component {
        setProperty(obj, name, value) {
            if (name in obj) Object.defineProperty(obj, name, { value: value, enumerable: true, configurable: true, writable: true }); else obj[name] = value
        }

        constructor(...e) {
            super(...e)

            let newState = {
                ...{
                    defaultLoad: true,
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
            return React.createElement("div", null,
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
                        this.state.scriptNames.map(script => {

                            const newLabel = !newScripts[script] ? null : React.createElement("span", {
                                style: {
                                    color: "red",
                                    textShadow: "rgb(255, 255, 255) 0px 0px 0.2em, rgb(0,0, 0) 0px 0px 0.2em"
                                }
                            }, " (NEW!)")

                            return React.createElement("div", { className: "setting-single" },
                                React.createElement("label", null,
                                    React.createElement("input", {
                                        type: "checkbox",
                                        checked: this.state.scripts[script],
                                        onChange: this.toggleScriptState.bind(this, script),
                                        disabled: script == "jdhooks-startup-settings.js"
                                    }),
                                    React.createElement("span", null, script, newLabel)
                                )
                            )
                        })
                    )
                )
            )
        }
    }

    class newSettingsClass extends exports {
        constructor(...e) { super(...e) }

        render() {
            let r = super.render()

            let newChild = React.createElement(Section, null)

            let generalSettings = r.props.children[2].props.children[0]
            if (generalSettings) {
                if (Array.isArray(generalSettings.props.children)) {
                    generalSettings.props.children.push(newChild)
                } else {
                    generalSettings.props.children = [generalSettings.props.children, newChild]
                }
            }

            return r
        }
    }

    return newSettingsClass
})

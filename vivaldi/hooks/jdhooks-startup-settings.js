//Settings: select hooks to load
//Настройки: выбор хуков для загрузки

vivaldi.jdhooks.hookSettingsWrapper("StartupSettings", function(fn, settingsKeys) {

    var newScripts = {};
    var jdhooksStartupSettings;

    var settings = vivaldi.jdhooks.require("_VivaldiSettings");

    vivaldi.jdhooks.hookMember(fn.prototype, "componentWillMount", function(hookData) {

        var _this = this;

        _this.updateHookSettings = function() {
            settings.set({
                JDHOOKS_STARTUP: jdhooksStartupSettings
            });
        };
        _this.toggleDefaultLoad = function() {
            jdhooksStartupSettings.defaultLoad = !_this.state.jdhooks_defaultLoad;
            _this.updateHookSettings();
            _this.setState({
                jdhooks_defaultLoad: !_this.state.jdhooks_defaultLoad
            });
        };
        _this.toggleScriptState = function(script) {
            jdhooksStartupSettings.scripts[script] = !_this.state["jdhooks_" + script];
            _this.updateHookSettings();
            var state = {};
            state["jdhooks_" + script] = !_this.state["jdhooks_" + script];
            _this.setState(state);
        };

        function updateState(obj) {
            var state = {
                jdhooks_defaultLoad: jdhooksStartupSettings.defaultLoad
            };

            //states
            for (script in vivaldi.jdhooks._hooks) {
                if (!(script in jdhooksStartupSettings.scripts)) {
                    jdhooksStartupSettings.scripts[script] = jdhooksStartupSettings.defaultLoad;
                    newScripts[script] = true;
                    updated = true;
                }

                state["jdhooks_" + script] = jdhooksStartupSettings.scripts[script];
            };

            obj.setState(state);
        }

        if (!jdhooksStartupSettings) {
            //read cfg, fill props & state
            settings.get("JDHOOKS_STARTUP", function(e) {
                if (undefined === e) e = {};
                if (undefined === e.defaultLoad) e.defaultLoad = true;
                if (undefined === e.scripts) e.scripts = {};

                jdhooksStartupSettings = e;
                var updated = false;

                //remove deleted scripts from settings
                for (script in jdhooksStartupSettings.scripts) {
                    if (!(script in vivaldi.jdhooks._hooks)) {
                        updated = true;
                        delete jdhooksStartupSettings.scripts[script];
                    }
                }

                updateState(_this);

                if (updated)
                    _this.updateHookSettings();

            }.bind(_this));
        } else
            updateState(_this);
    });


    vivaldi.jdhooks.hookMember(fn.prototype, "render", null, function(hookData) {

        //check if settings are loaded
        if (hookData.retValue && (undefined !== this.state.jdhooks_defaultLoad)) {

            var React = vivaldi.jdhooks.require("react_React");

            var subitems = [];

            var scriptNames = Object.keys(vivaldi.jdhooks._hooks);
            scriptNames.sort(function(first, second) {
                return first.localeCompare(second, {
                    sensitivity: "accent"
                });
            });

            for (scriptNum in scriptNames) {
                var script = scriptNames[scriptNum];

                var newLabel = !newScripts[script] ? null : React.createElement("span", {
                    style: {
                        color: "red",
                        textShadow: "rgb(255, 255, 255) 0px 0px 0.2em, rgb(0,0, 0) 0px 0px 0.2em"
                    }
                }, " (NEW!)");

                subitems.push(
                    React.createElement("div", {
                            className: "setting-single"
                        },
                        React.createElement("label", null,
                            React.createElement("input", {
                                type: "checkbox",
                                checked: this.state["jdhooks_" + script],
                                onChange: this.toggleScriptState.bind(this, script)
                            }),
                            React.createElement("span", null,
                                script,
                                newLabel
                            )
                        )
                    )
                );
            };

            hookData.retValue.props.children.push(
                React.createElement("div", null,
                    React.createElement("h2", null, "Hooks"),
                    React.createElement("div", {
                            className: "setting-group"
                        },
                        React.createElement("div", {
                                className: "setting-single"
                            },
                            React.createElement("label", null,
                                React.createElement("input", {
                                    type: "checkbox",
                                    checked: this.state.jdhooks_defaultLoad,
                                    onChange: this.toggleDefaultLoad.bind(this)
                                }),
                                React.createElement("span", null, "Startup mode for new items")
                            )
                        ),
                        React.createElement("div", {
                                className: "setting-group pad-top"
                            },
                            React.createElement("h3", null, "Load hook files"),
                            subitems)
                    )
                )
            );
        }

        return hookData.retValue;
    }); //vivaldi.jdhooks.hookMember(reactClass, "render", null, function(hookData)
});
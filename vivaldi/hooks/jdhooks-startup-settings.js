//Settings: select hooks to load
//Настройки: выбор хуков для загрузки

//settings
vivaldi.jdhooks.hookClass('StartupSetting', function(reactClass) {

    //settings init
    vivaldi.jdhooks.hookMember(reactClass, 'componentWillMount', function(hookData) {

        var settings = vivaldi.jdhooks.require('_VivaldiSettings');

        this.updateHookSettings = function() {
            settings.set({
                JDHOOKS_STARTUP: this.props.JDHOOKS_STARTUP
            });
        };

        this.toggleDefaultLoad = function() {
            this.props.JDHOOKS_STARTUP.defaultLoad = !this.state.jdhooks_defaultLoad;
            this.updateHookSettings();
            this.setState({
                jdhooks_defaultLoad: !this.state.jdhooks_defaultLoad
            });
        };

        this.toggleScriptState = function(script) {
            this.props.JDHOOKS_STARTUP.scripts[script] = !this.state['jdhooks_' + script];
            this.updateHookSettings();
            var state = {};
            state['jdhooks_' + script] = !this.state['jdhooks_' + script];
            this.setState(state);
        };

        //read cfg, fill props & state
        settings.get('JDHOOKS_STARTUP', function(e) {
            if (undefined === e) e = {};
            if (undefined === e.defaultLoad) e.defaultLoad = true;
            if (undefined === e.scripts) e.scripts = {};

            this.props.JDHOOKS_STARTUP = e;
            var updated = false;

            //remove deleted scripts from settings
            for (script in this.props.JDHOOKS_STARTUP.scripts) {
                if (!(script in vivaldi.jdhooks._hooks)) {
                    updated = true;
                    delete this.props.JDHOOKS_STARTUP.scripts[script];
                }
            }

            var state = {
                jdhooks_defaultLoad: this.props.JDHOOKS_STARTUP.defaultLoad
            };

            this.props.JDHOOKS_NEWSCRIPTS = {};

            //states
            for (script in vivaldi.jdhooks._hooks) {
                if (!(script in this.props.JDHOOKS_STARTUP.scripts)) {
                    this.props.JDHOOKS_STARTUP.scripts[script] = this.props.JDHOOKS_STARTUP.defaultLoad;
                    this.props.JDHOOKS_NEWSCRIPTS[script] = true;
                    updated = true;
                }

                state['jdhooks_' + script] = this.props.JDHOOKS_STARTUP.scripts[script];
            };

            this.setState(state);

            if (updated)
                this.updateHookSettings();

        }.bind(this));
    });


    vivaldi.jdhooks.hookMember(reactClass, 'render', null, function(hookData) {

        //check if settings are loaded
        if (undefined !== this.state.jdhooks_defaultLoad) {

            var React = vivaldi.jdhooks.require('react_React');

            var subitems = [];

            for (script in vivaldi.jdhooks._hooks) {

                var newLabel = !this.props.JDHOOKS_NEWSCRIPTS[script] ? null : React.createElement("span", {
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
                                checked: this.state['jdhooks_' + script],
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
    }); //vivaldi.jdhooks.hookMember(reactClass, 'render', null, function(hookData)

});
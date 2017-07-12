//GO button
//Кнопка перехода по ссылке из адресной строки

(function() {

    //default settings
    vivaldi.jdhooks.hookModule("_SettingsData_Common", function(moduleInfo, exportsInfo) {
        exportsInfo.exports["ADDRESS_BAR_URL_GO_ENABLED"] = true;
        exportsInfo.exports["ADDRESS_BAR_SEARCH_GO_ENABLED"] = true;
    });

    //settings
    vivaldi.jdhooks.hookSettingsWrapper("AddressBar", function(fn, settingsKeys) {//settings
    
	settingsKeys.push("ADDRESS_BAR_URL_GO_ENABLED", "ADDRESS_BAR_SEARCH_GO_ENABLED");

        var settingSaveCallback = function(settingKey, eventProperty, event) {
            vivaldi.jdhooks.require("_VivaldiSettings").set({
                [settingKey]: event.target[eventProperty]
            });
        };

        vivaldi.jdhooks.hookMember(fn.prototype, "render", null, function(hookData) {

            if (hookData.retValue) {
                var React = vivaldi.jdhooks.require("react_React");

                var settingKeys = this.props.vivaldiSettings;

                hookData.retValue.props.children.push(
                    React.createElement("h3", null, "GO button"));

                hookData.retValue.props.children.push(
                    React.createElement("div", {
                            className: "setting-single"
                        },
                        React.createElement(
                            "label",
                            null,
                            React.createElement("input", {
                                type: "checkbox",
                                checked: settingKeys.ADDRESS_BAR_URL_GO_ENABLED,
                                onChange: settingSaveCallback.bind(this, "ADDRESS_BAR_URL_GO_ENABLED", "checked")
                            }),
                            React.createElement("span", null, "UrlField")
                        )
                    ));

                hookData.retValue.props.children.push(
                    React.createElement("div", {
                            className: "setting-single"
                        },
                        React.createElement(
                            "label",
                            null,
                            React.createElement("input", {
                                type: "checkbox",
                                checked: settingKeys.ADDRESS_BAR_SEARCH_GO_ENABLED,
                                onChange: settingSaveCallback.bind(this, "ADDRESS_BAR_SEARCH_GO_ENABLED", "checked")
                            }),
                            React.createElement("span", null, "SearchField")
                        )
                    ));
            }
            return hookData.retValue;
        });

    });


    function newRender(hookData) {

        var React = vivaldi.jdhooks.require("react_React");
        var ReactDOM = vivaldi.jdhooks.require("react_ReactDOM");

        var settingKeys = this.props.vivaldiSettings;

        var findRef = function(ref) {
            for (var i = 0; i < hookData.retValue.props.children.length; i++) {
                if (hookData.retValue.props.children[i].ref === ref)
                    return i;
            }
            return false;
        };

        var createSVG = function() {
            return React.createElement("svg", {
                    width: "26",
                    height: "26",
                    viewBox: "0 0 26 26",
                },
                React.createElement("path", {
                    d: "M 12,4 10.400391,5.5996094 16.5,11.869141 l -13.5,0 0,2.261718 13.5,0 -6.099609,6.269532 L 12,22 21,13 12,4 Z"
                }))
        };

        if (settingKeys.ADDRESS_BAR_URL_GO_ENABLED) {
            var itm = findRef("addressfield");
            if (itm !== false) {
                hookData.retValue.props.children.splice(itm + 1, 0,
                    React.createElement(
                        "button", {
                            className: "button-toolbar buttonGo",
                            ref: "webpageview_nav_go",
                            onMouseUp: function(evt) {
                                var n = this.refs.urlField.props.editUrl;
                                if (!n) n = this.refs.urlField.props.url;
                                ReactDOM.findDOMNode(this.refs.urlField).value = n;

                                this.urlFieldGo(evt, {
                                    inCurrent: evt.button !== 1
                                })
                            }.bind(this),
                            style: {
                                outline: "none",
                                boxShadow: "none"
                            }
                        }, createSVG()));
            }
        }

        if (settingKeys.SEARCH_FIELD_ENABLED && settingKeys.ADDRESS_BAR_SEARCH_GO_ENABLED) {
            var itm = findRef("search");
            if (itm !== false) {
                hookData.retValue.props.children.splice(itm + 1, 0,
                    React.createElement("button", {
                        className: "button-toolbar buttonSearchGo",
                        ref: "webpageview_nav_s_go",
                        onMouseUp: function(evt) {
                            this.onSearch(
                                this.refs.search.refs.component.refs.instance.state.editText,
                                this.refs.search.refs.component.refs.instance.state.currentSearchEngine, {
                                    inCurrent: !(evt && evt.button === 1)
                                })
                        }.bind(this),
                        style: {
                            outline: "none",
                            boxShadow: "none"
                        }
                    }, createSVG()));
            }
        }

        return hookData.retValue;
    }


    vivaldi.jdhooks.hookSettingsWrapper("UrlBar", function(fn, settingsKeys) {
    	settingsKeys.push("ADDRESS_BAR_URL_GO_ENABLED", "ADDRESS_BAR_SEARCH_GO_ENABLED");
    	vivaldi.jdhooks.hookMember(fn.prototype, "render", null, newRender);
    });


})();
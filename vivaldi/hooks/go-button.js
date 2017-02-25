//GO button
//Кнопка перехода по ссылке из адресной строки

(function() {

    vivaldi.jdhooks.hookModule('VivaldiSettingsWrapper', function(moduleInfo) {
        vivaldi.jdhooks.hookMember(moduleInfo, 'exports', function(hookData, fn, settingsKeys) {
            if (fn) {
                if (fn.displayName === 'AddressBar' || fn.displayName === 'UrlBar') {
                    settingsKeys.push("ADDRESS_BAR_URL_GO_ENABLED", "ADDRESS_BAR_SEARCH_GO_ENABLED");
                }
            }
        });
    });

    //default settings
    vivaldi.jdhooks.hookModule('_SettingsData_Common', function(moduleInfo) {
        moduleInfo.exports['ADDRESS_BAR_URL_GO_ENABLED'] = true;
        moduleInfo.exports['ADDRESS_BAR_SEARCH_GO_ENABLED'] = true;
    });

    //settings
    vivaldi.jdhooks.hookClass('AddressBar', function(reactClass) {

        var settingSaveCallback = function(settingKey, eventProperty, event) {
            vivaldi.jdhooks.require('_VivaldiSettings').set({
                [settingKey]: event.target[eventProperty]
            });
        };

        if (reactClass.hasOwnProperty('vivaldiSettingsKeys')) //todo: remove in the future
            reactClass.vivaldiSettingsKeys.push("ADDRESS_BAR_URL_GO_ENABLED", "ADDRESS_BAR_SEARCH_GO_ENABLED");

        vivaldi.jdhooks.hookMember(reactClass, 'render', null, function(hookData) {

            if (hookData.retValue) {
                var React = vivaldi.jdhooks.require('react_React');

                var settingKeys = this.state && this.state.hasOwnProperty('ADDRESS_BAR_URL_GO_ENABLED') ? this.state : this.props.vivaldiSettings; //todo: remove in the future

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

    vivaldi.jdhooks.hookClass('UrlBar', function(reactClass) {

        if (reactClass.hasOwnProperty('vivaldiSettingsKeys')) //todo: remove in the future
            reactClass.vivaldiSettingsKeys.push("ADDRESS_BAR_URL_GO_ENABLED", "ADDRESS_BAR_SEARCH_GO_ENABLED");

        vivaldi.jdhooks.hookMember(reactClass, 'render', null, function(hookData) {

            var React = vivaldi.jdhooks.require('react_React');
            var ReactDOM = vivaldi.jdhooks.require('react_ReactDOM');

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

            if (this.state.ADDRESS_BAR_URL_GO_ENABLED) {
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

            if (this.state.SEARCH_FIELD_ENABLED && this.state.ADDRESS_BAR_SEARCH_GO_ENABLED) {
                var itm = findRef("search");
                if (itm !== false) {
                    hookData.retValue.props.children.splice(itm + 1, 0,
                        React.createElement("button", {
                            className: "button-toolbar buttonSearchGo",
                            ref: "webpageview_nav_s_go",
                            onMouseUp: function(evt) {
                                this.onSearch(this.state.searchText, this.state.currentSearchEngine.Url, {
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
        });

    });

})();
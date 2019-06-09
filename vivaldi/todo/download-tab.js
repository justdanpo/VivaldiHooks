//Open Download Tab instead of Download Panel
//Открывать загрузки во вкладке, а не в панели

(function() {

    //settings
    vivaldi.jdhooks.hookSettingsWrapper("DownloadSettings", function(fn, settingsKeys) { //settings

        settingsKeys.push("AUTOMATICALLY_DOWNLOAD_FILES", "SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS");

        var settingSaveCallback = function(settingKey, eventProperty, event) {
            vivaldi.jdhooks.require("_VivaldiSettings").set({
                [settingKey]: event.target[eventProperty]
            });
        };

        vivaldi.jdhooks.hookMember(fn.prototype, "render", null, function(hookData) {
            var React = vivaldi.jdhooks.require("react_React");
            if (hookData.retValue)
                hookData.retValue.props.children.push(
                    React.createElement("div", {
                            className: "setting-single",
                        },
                        React.createElement("label", null, React.createElement("input", {
                            type: "checkbox",
                            checked: this.props.vivaldiSettings.SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS,
                            onChange: settingSaveCallback.bind(this, "SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS", "checked")
                        }), React.createElement("span", null, "Open downloads in new tab instead of panel")))
                );

            return hookData.retValue;
        });
    });

    var openDownloadTab = function() {
        var downloadTabPageStore = vivaldi.jdhooks.require("_PageStore");

        if (!downloadTabPageStore.getPages().find(function(page) {
                return page.get("url") === "chrome://downloads/"
            })) {
            vivaldi.jdhooks.require("_PageActions").openURL("vivaldi://downloads", {
                singleton: true,
                inBackground: true,
                isTyped: false
            })
        }
    };

    vivaldi.jdhooks.hookSettingsWrapper("WebPageContent", function(fn, settingsKeys) {
        settingsKeys.push("AUTOMATICALLY_DOWNLOAD_FILES", "SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS");

        vivaldi.jdhooks.hookMember(fn.prototype, "componentDidMount", function(hookData) {
            var _this = this;
            vivaldi.jdhooks.hookMember(this, "handleOnPermissionRequest", function(hookData, event) {
                if (event.permission === "download") {
                    if (_this.props.vivaldiSettings.AUTOMATICALLY_DOWNLOAD_FILES &&
                        _this.props.vivaldiSettings.SHOW_DOWNLOADPANEL_FOR_NEW_DOWNLOADS &&
                        _this.props.vivaldiSettings.SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS
                    ) {
                        event.preventDefault();
                        event.request.allow();
                        openDownloadTab();
                        hookData.abort();
                    }
                }
            });
        });
    });



    vivaldi.jdhooks.hookSettingsWrapper("DownloadDialog", function(fn, settingsKeys) {
        settingsKeys.push("AUTOMATICALLY_DOWNLOAD_FILES", "SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS");

        vivaldi.jdhooks.hookMember(fn.prototype, "componentWillMount", function(hookData) {

            var _this = this;

            _this.showDownloads = function() {
                _this.setState({
                    shown: !_this.state.shown
                });

                if (_this.props.vivaldiSettings.SHOW_DOWNLOADPANEL_FOR_NEW_DOWNLOADS) {
                    if (_this.props.vivaldiSettings.SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS) {
                        openDownloadTab();
                    } else if (!document.querySelector("#panels-container .downloads.active")) {
                        vivaldi.jdhooks.require("_ActionManager").executeActions("COMMAND_SHOW_DOWNLOADS_PANEL")
                    }
                }

                _this.close()
            };

            _this.onOpen = function() {
                _this.props.customData.request.allow("open");
                _this.showDownloads();
            };
            _this.onSave = function() {
                _this.props.customData.request.allow();
                _this.showDownloads();
            };
            _this.onSaveAs = function() {
                _this.props.customData.request.allow("saveas");
                _this.showDownloads();
            };
        })
    });
})();
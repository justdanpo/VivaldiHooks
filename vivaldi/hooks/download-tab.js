//Open Download Tab instead of Download Panel
//Открывать загрузки во вкладке, а не в панели

(function() {

    //settings
    vivaldi.jdhooks.hookClass('DownloadSettings', function(reactClass) {

        reactClass.vivaldiSettingsKeys.push("SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS");

        vivaldi.jdhooks.hookMember(reactClass, 'render', null, function(hookData) {

            var React = vivaldi.jdhooks.require('react_React');

            if (hookData.retValue)
                hookData.retValue.props.children.push(
                    React.createElement("div", {
                            className: "setting-single",
                            style: {
                                paddingLeft: "24px"
                            }
                        },
                        React.createElement("label", null, React.createElement("input", {
                            type: "checkbox",
                            checked: this.state.SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS,
                            onChange: this.saveVivaldiSettingFromEvent.bind(this, "SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS", "checked")
                        }), React.createElement("span", null, vivaldi.jdhooks.require('_getLocalizedMessage')("Open in Background Tab"))))
                );

            return hookData.retValue;
        });
    });

    var openDownloadTab = function() {
        var downloadTabPageStore = vivaldi.jdhooks.require('_PageStore');

        if (!downloadTabPageStore.getPages().find(function(page) {
                return page.get("url") === "chrome://downloads/"
            })) {
            vivaldi.jdhooks.require('_PageActions').openURL("vivaldi://downloads", {
                singleton: true,
                inBackground: true,
                isTyped: false
            })
        }
    };

    vivaldi.jdhooks.hookClass('WebPageContent', function(reactClass) {

        reactClass.vivaldiSettingsKeys.push("AUTOMATICALLY_DOWNLOAD_FILES", "SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS");

        vivaldi.jdhooks.hookMember(reactClass, 'handleOnPermissionRequest', function(hookData, event) {
            if (event.permission === "download") {
                if (this.state.AUTOMATICALLY_DOWNLOAD_FILES &&
                    this.state.SHOW_DOWNLOADPANEL_FOR_NEW_DOWNLOADS &&
                    this.state.SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS
                ) {
                    event.preventDefault();
                    event.request.allow();
                    openDownloadTab();
                    hookData.abort();
                }
            }
        });
    });

    vivaldi.jdhooks.hookClass('DownloadDialog', function(reactClass) {

        reactClass.vivaldiSettingsKeys.push("SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS");

        reactClass.showDownloads = function() {
            this.setState({
                shown: !this.state.shown
            });

            if (this.state.SHOW_DOWNLOADPANEL_FOR_NEW_DOWNLOADS) {
                if (this.state.SHOW_DOWNLOADTAB_FOR_NEW_DOWNLOADS) {
                    openDownloadTab();
                } else if (!document.querySelector("#panels-container .downloads.active")) {
                    vivaldi.jdhooks.require('_ActionManager').executeActions("COMMAND_SHOW_DOWNLOADS_PANEL")
                }
            }

            this.close()
        };

        reactClass.onOpen = function() {
            this.props.customData.request.allow("open");
            this.showDownloads();
        };
        reactClass.onSave = function() {
            this.props.customData.request.allow();
            this.showDownloads();
        };
        reactClass.onSaveAs = function() {
            this.props.customData.request.allow("saveas");
            this.showDownloads();
        };

    });

})();
//Prevent Shift+Alt menu appearance
//Не открывать меню по Shift+Alt

vivaldi.jdhooks.hookModule('VivaldiSettingsWrapper', function(moduleInfo) {
    vivaldi.jdhooks.hookMember(moduleInfo, 'exports', function(hookData, fn, settingsKeys) {

        //TitleBar
        if ((settingsKeys.indexOf("VIVALDI_MENU_POSITION") > -1) && (-1 !== (fn.prototype.render + '').indexOf('"titlebar"'))) {

            vivaldi.jdhooks.hookMember(fn.prototype, 'componentWillMount', function(hookData) {

                var _this = this;
                vivaldi.jdhooks.hookMember(this, 'onKeyDown', function(hookData, event) {
                    if (event.key === "Alt" && (event.shiftKey || event.ctrlKey)) {
                        hookData.abort();
                        _this.stopMenuDetection();
                    }
                });
            });
        }
    })
});
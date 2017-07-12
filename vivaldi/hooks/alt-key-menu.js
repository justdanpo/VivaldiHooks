//Prevent Shift+Alt menu appearance
//Не открывать меню по Shift+Alt

vivaldi.jdhooks.hookSettingsWrapper("TitleBar", function(fn, settingsKeys) {

    vivaldi.jdhooks.hookMember(fn.prototype, "componentWillMount", function(hookData) {

        var _this = this;
        vivaldi.jdhooks.hookMember(this, "onKeyDown", function(hookData, event) {
            if (event.key === "Alt" && (event.shiftKey || event.ctrlKey)) {
                hookData.abort();
                _this.stopMenuDetection();
            }
        });
    });
})
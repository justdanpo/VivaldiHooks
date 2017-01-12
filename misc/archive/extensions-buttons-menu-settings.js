//"Settings" in a context menu of extensions buttons
//"Настройки" в контекстном меню кнопок расширений

vivaldi.jdhooks.hookClass('ExtensionActionItem', function(reactClass) {

    reactClass.openOptions = function() {
        if (this.optionsUrl) {
            vivaldi.jdhooks.require('_PageActions').openURL(this.optionsUrl, {
                inCurrent: false,
                inBackground: false,
                isTyped: false
            });
        }

    };

    vivaldi.jdhooks.hookMember(reactClass, 'getInitialState', null, function(hookData) {

        var optionsItem = {
            name: vivaldi.jdhooks.require('_getLocalizedMessage')("Settings"),
            handler: this.openOptions,
            visible: false
        };

        var __t = this;
        chrome.management.get(
            this.props.id,
            function(extinfo) {
                if (extinfo.optionsUrl && extinfo.optionsUrl !== "") {
                    __t.optionsUrl = extinfo.optionsUrl;
                    optionsItem.visible = true;
                }
            }
        );

        hookData.retValue.menuItems.push(optionsItem);

        return hookData.retValue;
    });
});
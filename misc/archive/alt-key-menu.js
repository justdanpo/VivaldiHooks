//Prevent Shift+Alt menu appearance
//Не открывать меню по Shift+Alt

vivaldi.jdhooks.hookSettingsWrapper("TitleBar", function (fn, settingsKeys) {

    const keyCodes = vivaldi.jdhooks.require("_KeyCodes")

    function hookFn() {
        const _this = this;
        vivaldi.jdhooks.hookMember(this, "_keyEventListener", (hookData, keyPress, modif, keyCode) => {
            if (keyCode === keyCodes.KEY_ALT && (modif & 3)) _this.lastKeyWasAltDown = false
        })
    }

    if (fn.prototype["componentWillMount"])
        vivaldi.jdhooks.hookMember(fn.prototype, hookFn)
    else
        fn.prototype["componentWillMount"] = hookFn
})
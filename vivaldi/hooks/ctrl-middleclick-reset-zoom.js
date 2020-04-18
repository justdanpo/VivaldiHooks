//Ctrl+MiddleClick on a webpage contents - reset zoom
//Ctrl+MiddleClick на содержимом страницы - сброс масштаба

vivaldi.jdhooks.onUIReady(function () {
    let keyCodes = vivaldi.jdhooks.require("_KeyCodes")

    var node = document.querySelector("#webview-container")
    if (node) {
        let ctrl = false
        window.vivaldi.tabsPrivate.onKeyboardChanged.addListener((pressed, keymask, keycode, some) => { if (keycode === keyCodes.KEY_CONTROL) ctrl = pressed })

        node.addEventListener("mouseup", event => {
            if (ctrl && event.button === 1) {
                vivaldi.jdhooks.require("_PageZoom").pageZoomReset()
                event.preventDefault()
            }
        })
    }
})

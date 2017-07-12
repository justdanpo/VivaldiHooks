//Move Minimize/Zoom/Close buttons to addressbar when Vivaldi is maximized and tab position is NOT "Top"

(function() {

    var style = document.createElement("style");
    style.setAttribute("description", "added by move-window-buttons-maximized.js");
    style.textContent =
        "#browser:not(.native):not(.horizontal-menu):not(.tabs-top).maximized #header { top:-100px; position:absolute } " +

        "#browser.horizontal-menu .MaximizedWindowButtons, " +
        "#browser.tabs-top .MaximizedWindowButtons, " +
        "#browser:not(.maximized) .MaximizedWindowButtons," +
        "#browser.native .MaximizedWindowButtons { display: none } ";
    document.head.appendChild(style);


    function hookRender(reactClass) {
        var iconClose, iconMinimize, iconZoom;

        switch (window.navigator.appVersion.indexOf("Windows NT 10") > 0 ? "win10" : vivaldi.jdhooks.require("_GetPlatform")()) {
            case "linux":
            case "win":
                iconClose = vivaldi.jdhooks.require("_svg_window_close");
                iconMinimize = vivaldi.jdhooks.require("_svg_window_minimize");
                iconZoom = vivaldi.jdhooks.require("_svg_window_zoom");
                break;
            case "win10":
                iconClose = vivaldi.jdhooks.require("_svg_window_close_win10");
                iconMinimize = vivaldi.jdhooks.require("_svg_window_minimize_win10");
                iconZoom = vivaldi.jdhooks.require("_svg_window_zoom_win10");
                break;
            case "mac":
                iconClose = vivaldi.jdhooks.require("_svg_window_close_mac");
                iconMinimize = vivaldi.jdhooks.require("_svg_window_minimize_mac");
                iconZoom = vivaldi.jdhooks.require("_svg_window_zoom_mac");
        }

        function createButton(className, image) {
            return vivaldi.jdhooks.require("react_React").createElement("button", {
                tabIndex: "-1",
                className: "button-toolbar MaximizedWindowButtons " + className,
                style: {
                    order: 255
                },
                onClick: function() {
                    document.querySelector("#titlebar > .window-buttongroup ." + className).click()
                },
                dangerouslySetInnerHTML: {
                    __html: image
                }
            })
        }

        vivaldi.jdhooks.hookMember(reactClass, "render", null, function(hookData) {
            hookData.retValue.props.children.push(
                createButton("window-minimize", iconMinimize),
                createButton("window-maximize", iconZoom),
                createButton("window-close", iconClose)
            );
            return hookData.retValue;
        });
    }


    vivaldi.jdhooks.hookSettingsWrapper("UrlBar", function(fn, settingsKeys) {
        hookRender(fn.prototype);
    });


    vivaldi.jdhooks.hookSettingsWrapper("MailBar", function(fn, settingsKeys) {
        hookRender(fn.prototype)
    });

})();
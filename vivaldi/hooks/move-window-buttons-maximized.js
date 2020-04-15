//Move Minimize/Zoom/Close buttons to addressbar when Vivaldi is maximized and tab position is NOT "Top"

vivaldi.jdhooks.addStyle(`
#browser:not(.native):not(.horizontal-menu):not(.tabs-top).maximized #header { display: none; }

#browser.horizontal-menu .MaximizedWindowButtons,
#browser.tabs-top .MaximizedWindowButtons,
#browser:not(.maximized) .MaximizedWindowButtons,
#browser.native .MaximizedWindowButtons { display: none }

.MaximizedWindowButtons.window-buttongroup {
    position: relative !important;
    align-self: baseline;  
}

.MaximizedWindowButtonsSpecifySize {
    width: 34px !important;
    height: 34px !important;
}

#vivaldi-button-moved {
    order: -1;
}
#vivaldi-button-moved path {
    fill: currentColor;
}
`)

vivaldi.jdhooks.hookModule("urlfield_urlbar", function (moduleInfo, exportsInfo) {
    const React = vivaldi.jdhooks.require("React")
    const ShowMenu = vivaldi.jdhooks.require("_ShowMenu")
    const CommandManager = vivaldi.jdhooks.require("_CommandManager")

    let newType = vivaldi.jdhooks.hookForwardRef(exportsInfo.exports, oldClass => {
        class newclass extends oldClass {
            constructor(...e) { super(...e) }

            vivaldiButtonClick(event) {
                const rect = this.refs.movedVButton.getBoundingClientRect()
                const props = {
                    id: 0,
                    rect: {
                        x: parseInt(rect.left),
                        y: parseInt(rect.top),
                        width: parseInt(rect.width),
                        height: parseInt(rect.height)
                    },
                    menu: { items: CommandManager.getVerticalMenu() }
                };
                ShowMenu.show(props.id, [props], "bottom")
            }

            render() {
                let ret = super.render()

                let iconClose, iconMinimize, iconZoom;

                const platform = window.navigator.platform.indexOf("Linux") >= 0 ?
                    "linux" :
                    navigator.platform.indexOf("MacIntel") >= 0 ?
                        "mac" :
                        window.navigator.appVersion.indexOf("Windows NT 10") >= 0 ?
                            "win10" :
                            "win"

                switch (platform) {
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
                    return React.createElement("button", {
                        tabIndex: "-1",
                        className: "MaximizedWindowButtons " + className,
                        style: {
                            order: 255
                        },
                        onClick: function () {
                            document.querySelector(`#browser > #header > #titlebar .${className}`).click()
                        },
                        dangerouslySetInnerHTML: {
                            __html: image
                        }
                    })
                }

                ret.props.children.push(
                    React.createElement("div", { className: "button-toolbar MaximizedWindowButtons MaximizedWindowButtonsSpecifySize", id: "vivaldi-button-moved" },
                        React.createElement("button", {
                            tabIndex: "-1",
                            className: "vivaldi MaximizedWindowButtonsSpecifySize",
                            id: "vivaldi-button-moved-button",
                            ref: "movedVButton",
                            dangerouslySetInnerHTML: {
                                __html: vivaldi.jdhooks.require("_svg_menu_vivaldi")
                            },
                            onClick: this.vivaldiButtonClick.bind(this)
                        }))
                )

                ret.props.children.push(
                    React.createElement("div", { className: "MaximizedWindowButtons window-buttongroup" },
                        createButton("window-minimize", iconMinimize),
                        createButton("window-maximize", iconZoom),
                        createButton("window-close", iconClose)
                    )
                )

                return ret
            }
        }
        return newclass
    })

    if (null === newType) {
        console.error("move-window-buttons-minimized.js: cannot dereference type")
    } else {
        exportsInfo.exports = newType
    }
})
